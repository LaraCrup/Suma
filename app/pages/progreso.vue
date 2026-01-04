<template>
    <DefaultSection>
        <HeadingH1 class="w-full">Tu progreso</HeadingH1>

        <div v-if="loading" class="w-full flex justify-center py-8">
            <Loader />
        </div>

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
                    <p class="text-[10px] text-gray">{{ userXP.experience_points }} XP</p>
                    <p class="text-[10px] text-gray" v-if="!levelInfo.isMaxLevel">
                        {{ levelInfo.nextLevelXP }} XP para nivel {{ levelInfo.nextLevel }}
                    </p>
                    <p class="text-[10px] text-gray" v-else>¡Nivel máximo!</p>
                </div>
            </div>
            <div class="w-full flex flex-col gap-2">
                <BenefitsCard></BenefitsCard>
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

    // Obtener todos los logs completados
    const { data: completedLogs, error } = await client
        .from('habit_logs')
        .select('id, habit_id, date')
        .eq('completed', true)

    if (error) {
        console.error('Error calculando constancia:', error)
        consistencyPercentage.value = 0
        return
    }

    const totalCompleted = completedLogs?.length || 0

    // Calcular días esperados: por ahora usamos un estimado simple
    // Esto se puede mejorar calculando exactamente qué días cada hábito debería estar activo
    const oldestHabit = habits.value.reduce((oldest, habit) => {
        const habitDate = new Date(habit.created_at)
        const oldestDate = new Date(oldest.created_at)
        return habitDate < oldestDate ? habit : oldest
    })

    const today = getArgentineDate()
    const [year, month, day] = today.split('-').map(Number)
    const todayDate = new Date(year, month - 1, day)
    const oldestDate = new Date(oldestHabit.created_at)

    const daysSinceStart = Math.max(1, Math.floor((todayDate - oldestDate) / (1000 * 60 * 60 * 24)))
    const expectedTotal = daysSinceStart * habits.value.length

    if (expectedTotal === 0) {
        consistencyPercentage.value = 0
        return
    }

    consistencyPercentage.value = Math.min(100, Math.round((totalCompleted / expectedTotal) * 100))
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

onMounted(() => {
    loadData()
})
</script>