<template>
    <DefaultSection>
        <HeadingH1 class="w-full">Tu progreso</HeadingH1>

        <SkeletonProgresoDashboard v-if="loading" />

        <template v-else>
            <!-- Progreso de hoy -->
            <div class="w-full flex flex-col gap-1">
                <div class="w-full flex items-center justify-between">
                    <p class="text-xs">Progreso de hoy</p>
                    <p class="text-xs font-bold text-primary">{{ todayProgressPercentage }}%</p>
                </div>
                <ProgressBar
                    :progress-count="todayStats.completed"
                    :goal-value="todayStats.total"
                    bar-color="bg-gradient-secondary"
                />
            </div>

            <!-- Estadísticas -->
            <div class="w-full flex gap-3">
                <!-- Hábito más constante -->
                <div class="w-50% flex flex-col gap-1">
                    <p class="text-xs">Tu hábito más constante</p>
                    <div class="md:h-16 w-full bg-midlight rounded-lg p-3">
                        <template v-if="mostConsistentHabit">
                            <p class="text-xs truncate">{{ mostConsistentHabit.name }}</p>
                            <span class="text-xl font-bold text-primary">
                                {{ mostConsistentHabit.longest_streak }} {{ mostConsistentHabit.longest_streak === 1 ? 'día' : 'días' }}
                            </span>
                        </template>
                        <template v-else>
                            <p class="text-xs text-gray">Sin datos aún</p>
                        </template>
                    </div>
                </div>

                <!-- Porcentaje de constancia -->
                <div class="w-50% flex flex-col gap-1">
                    <p class="text-xs">Tu porcentaje de constancia</p>
                    <div class="md:h-16 w-full bg-midlight rounded-lg p-3">
                        <span class="text-[1.75rem] font-bold text-primary">{{ consistencyPercentage }}%</span>
                    </div>
                </div>
            </div>

            <!-- Beneficios -->
            <h2 class="w-full font-montserrat text-xl font-medium text-primary">Tus beneficios</h2>
            <div class="w-full flex flex-col gap-1">
                <div class="w-full flex items-center justify-between">
                    <span
                        class="w-6 h-6 flex justify-center items-center bg-primary text-light text-xs font-bold rounded-full">
                        {{ levelInfo.currentLevel }}
                    </span>
                    <span
                        :class="levelInfo.isMaxLevel ? 'bg-primary' : 'bg-gray'"
                        class="w-6 h-6 flex justify-center items-center text-light text-xs font-bold rounded-full">
                        {{ levelInfo.isMaxLevel ? '👑' : levelInfo.nextLevel }}
                    </span>
                </div>
                <ProgressBar
                    :progress-count="levelInfo.xpInCurrentLevel"
                    :goal-value="levelInfo.xpNeededForNextLevel"
                    bar-color="bg-gradient-secondary"
                />
                <div class="w-full flex items-center justify-between">
                    <p class="text-xs text-gray">{{ userXP.experience_points }} XP</p>
                    <p class="text-xs text-gray" v-if="!levelInfo.isMaxLevel">
                        {{ levelInfo.nextLevelXP }} XP para nivel {{ levelInfo.nextLevel }}
                    </p>
                    <p class="text-xs text-gray" v-else>¡Nivel máximo!</p>
                </div>
            </div>
            <div class="w-full flex flex-col gap-2">
                <template v-if="benefits.length > 0">
                    <BenefitsCard
                        v-for="benefit in benefits"
                        :key="benefit.id"
                        :benefit="benefit"
                    />
                </template>
                <p v-else class="text-xs text-gray">Aún no desbloqueaste ningún beneficio.</p>
            </div>
        </template>
    </DefaultSection>
</template>

<script setup>
const { getHabits, shouldShowHabitToday, getArgentineDate } = useHabits()
const { getUserExperience, getLevelInfo } = useExperience()
const client = useSupabaseClient()

const loading = ref(true)
const habits = ref([])
const benefits = ref([])
const todayStats = ref({ completed: 0, total: 0 })
const mostConsistentHabit = ref(null)
const consistencyPercentage = ref(0)
const userXP = ref({ experience_points: 0, current_level: 1 })
const levelInfo = ref({
    currentLevel: 1,
    nextLevel: 2,
    currentLevelXP: 0,
    nextLevelXP: 300,
    xpInCurrentLevel: 0,
    xpNeededForNextLevel: 300,
    progressPercentage: 0,
    isMaxLevel: false
})

const todayProgressPercentage = computed(() => {
    if (todayStats.value.total === 0) return 0
    return Math.round((todayStats.value.completed / todayStats.value.total) * 100)
})

const calculateTodayProgress = async () => {
    const habitsForToday = []

    for (const habit of habits.value) {
        const shouldShow = await shouldShowHabitToday(habit)
        if (shouldShow) {
            habitsForToday.push(habit)
        }
    }

    const completed = habitsForToday.filter(h =>
        (h.progress_count || 0) >= (h.goal_value || 1)
    ).length

    todayStats.value = {
        completed,
        total: habitsForToday.length
    }
}

const findMostConsistentHabit = () => {
    if (habits.value.length === 0) {
        mostConsistentHabit.value = null
        return
    }

    const habitsWithStreak = habits.value.filter(h => (h.longest_streak || 0) > 0)

    if (habitsWithStreak.length === 0) {
        mostConsistentHabit.value = null
        return
    }

    mostConsistentHabit.value = habitsWithStreak.reduce((max, habit) =>
        (habit.longest_streak || 0) > (max.longest_streak || 0) ? habit : max
    )
}

const calculateConsistencyPercentage = async () => {
    if (habits.value.length === 0) {
        consistencyPercentage.value = 0
        return
    }

    const { data: { session } } = await client.auth.getSession()
    if (!session?.user?.id) {
        consistencyPercentage.value = 0
        return
    }

    const habitIds = habits.value.map(h => h.id)
    const { data: completedLogs, error } = await client
        .from('habit_logs')
        .select('habit_id')
        .in('habit_id', habitIds)
        .eq('completed', true)

    if (error) {
        console.error('Error calculando constancia:', error)
        consistencyPercentage.value = 0
        return
    }

    const today = getArgentineDate()
    const [ty, tm, td] = today.split('-').map(Number)
    const todayDate = new Date(ty, tm - 1, td)

    // Mapeo de letra a número de día JS (0=domingo)
    const DAY_LETTERS = { L: 1, M: 2, X: 3, J: 4, V: 5, S: 6, D: 0 }

    const countExpectedDays = (habit) => {
        const created = new Date(habit.created_at)
        const startDate = new Date(created.getFullYear(), created.getMonth(), created.getDate())
        const totalDays = Math.max(1, Math.floor((todayDate - startDate) / (1000 * 60 * 60 * 24)) + 1)

        // diario siempre aplica todos los días
        if (habit.frequency_type === 'diario' || !habit.frequency_type) return totalDays
        // todos = aplica cada día del período
        if (habit.frequency_option === 'todos') return totalDays

        if (habit.frequency_option === 'dias_especificos_semana') {
            const selectedNums = (habit.frequency_detail?.weekDays || [])
                .map(l => DAY_LETTERS[l])
                .filter(n => n !== undefined)
            let count = 0
            const cursor = new Date(startDate)
            while (cursor <= todayDate) {
                if (selectedNums.includes(cursor.getDay())) count++
                cursor.setDate(cursor.getDate() + 1)
            }
            return count
        }

        if (habit.frequency_option === 'cantidad_dias_semana') {
            const counter = habit.frequency_detail?.counter || 0
            const totalWeeks = Math.ceil(totalDays / 7)
            return totalWeeks * counter
        }

        if (habit.frequency_option === 'dias_especificos_mes') {
            const selectedDays = habit.frequency_detail?.monthDays || []
            let count = 0
            const cursor = new Date(startDate)
            while (cursor <= todayDate) {
                if (selectedDays.includes(cursor.getDate())) count++
                cursor.setDate(cursor.getDate() + 1)
            }
            return count
        }

        if (habit.frequency_option === 'cantidad_dias_mes') {
            const counter = habit.frequency_detail?.counter || 0
            const months = (todayDate.getFullYear() - startDate.getFullYear()) * 12
                + (todayDate.getMonth() - startDate.getMonth()) + 1
            return Math.max(1, months) * counter
        }

        return totalDays
    }

    const expectedTotal = habits.value.reduce((sum, habit) => sum + countExpectedDays(habit), 0)

    if (expectedTotal === 0) {
        consistencyPercentage.value = 0
        return
    }

    consistencyPercentage.value = Math.min(100, Math.round(((completedLogs?.length || 0) / expectedTotal) * 100))
}

const loadData = async () => {
    try {
        loading.value = true
        habits.value = await getHabits()

        await Promise.all([
            calculateTodayProgress(),
            calculateConsistencyPercentage(),
            loadUserXP()
        ])

        await loadBenefits()

        findMostConsistentHabit()
    } catch (error) {
        console.error('Error cargando estadísticas:', error)
    } finally {
        loading.value = false
    }
}

const loadUserXP = async () => {
    try {
        userXP.value = await getUserExperience()
        levelInfo.value = await getLevelInfo(userXP.value.experience_points)
    } catch (error) {
        console.error('Error cargando XP:', error)
    }
}

const loadBenefits = async () => {
    try {
        const currentLevel = levelInfo.value.currentLevel
        const { data, error } = await client
            .from('benefits')
            .select('id, title, image_url, brands ( name, image_url )')
            .eq('status', 'approved')
            .eq('level', currentLevel)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error cargando beneficios:', error)
            return
        }

        benefits.value = (data || []).map(b => ({
            id: b.id,
            title: b.title,
            image: b.image_url || null,
            brand_name: b.brands?.name || '',
            brand_image: b.brands?.image_url || null
        }))
    } catch (error) {
        console.error('Error cargando beneficios:', error)
    }
}

onMounted(() => {
    loadData()
})
</script>