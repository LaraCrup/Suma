<template>
    <DefaultSection class="!gap-3">
        <HabitsDateNavigator ref="dateNavigatorRef" v-model="selectedDate" />
        <div class="w-full flex justify-between items-center mt-2">
            <HeadingH1 class="w-full">Mis hábitos</HeadingH1>
            <NuxtLink :to="ROUTE_NAMES.HABITS_CREATE" class="w-7 h-7 flex-shrink-0 flex justify-center items-center bg-green-dark text-light rounded-full text-lg leading-none">+</NuxtLink>
        </div>
        <div class="w-full flex flex-col gap-1">
            <template v-if="isLoading">
                <SkeletonHabitCard v-for="i in 3" :key="i" />
            </template>
            <template v-else>
                <HabitsCard
                    v-for="habit in visibleHabits"
                    :key="habit.id"
                    :habit="habit"
                    :selectedDate="selectedDate"
                    @habitUpdated="handleHabitUpdated"
                />
                <p v-if="visibleHabits.length === 0" class="text-sm text-gray text-center py-4">No hay hábitos para hoy. ¡Descansa!</p>
            </template>
        </div>

        <div v-if="hiddenHabits.length > 0" class="w-full flex flex-col gap-1">
            <button
                @click="showAllHabits = !showAllHabits"
                class="w-full flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
                <p class="text-sm">Ver todos mis hábitos ({{ hiddenHabits.length }})</p>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    :class="['w-4 text-primary transition-transform', showAllHabits ? '-rotate-90' : 'rotate-90']"
                >
                    <path fill="currentColor" d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"/>
                </svg>
            </button>

            <transition name="expand">
                <div v-if="showAllHabits" class="w-full flex flex-col gap-1">
                    <HabitsCard
                        v-for="habit in hiddenHabits"
                        :key="habit.id"
                        :habit="habit"
                        :selectedDate="selectedDate"
                        @habitUpdated="handleHabitUpdated"
                    />
                </div>
            </transition>
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Mis hábitos comunitarios</HeadingH1>
        <div class="w-full flex flex-col gap-1">
            <template v-if="isCommunityLoading">
                <SkeletonCommunityHabitCard v-for="i in 2" :key="i" />
            </template>
            <template v-else>
                <HabitsCommunityCard
                    v-for="item in communityHabits"
                    :key="item.habit.id"
                    :habit="item.habit"
                    :members="item.members"
                    @habitUpdated="handleCommunityHabitUpdated"
                />
                <p v-if="communityHabits.length === 0" class="text-sm text-gray text-center py-4">Todavía no pertenecés a ninguna comunidad.</p>
            </template>
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Tip de hoy</HeadingH1>
        <SkeletonTipCard v-if="isTipLoading" />
        <div v-else-if="currentTip" class="w-full flex flex-col">
            <NuxtImg :src="`/images/tips/${currentTip.image}.webp`" alt="Tip de hábito" class="w-full h-48 rounded-t-lg object-cover" />
            <div class="w-full bg-midlight rounded-b-lg p-3">
                <p class="text-primary text-sm font-semibold">{{ currentTip.title }}</p>
                <p class="text-xs mt-1">{{ currentTip.description }}</p>
            </div>
        </div>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'
import { useHabits } from '~/composables/useHabits'
import { useAuthStore } from '~/stores/authStore'

const { getHabitsForDate, shouldShowHabitForDate, syncHabitsWithNewDay, getArgentineDate } = useHabits()
const { getCommunities, getCommunityHabitCompletions } = useCommunities()
const authStore = useAuthStore()
const habits = ref([])
const showAllHabits = ref(false)
const communityHabits = ref([])
const selectedDate = ref(getArgentineDate())

const isLoading = ref(true)
const isCommunityLoading = ref(true)
const isTipLoading = ref(true)
const dateNavigatorRef = ref(null)

const tips = [
    {
        title: 'Empezá con el hábito más corto.',
        description: 'El impulso te va a ayudar con el resto. Cuando empezás por lo simple, tu mente interpreta que “es fácil seguir”. Esa pequeña victoria inicial activa la motivación.',
        image: 'habito-corto'
    },
    {
        title: 'Hace tu hábito visible.',
        description: 'Los hábitos empiezan con una señal. Si lo que querés hacer está a la vista, lo vas a hacer más fácil. Dejá la botella de agua en el escritorio, el libro en la mesa de luz o las zapatillas cerca de la puerta.',
        image: 'hacelo-visible'
    },
    {
        title: 'Dos minutos son suficientes.',
        description: 'Cuando iniciar es difícil, reducí el hábito a su mínima expresión. Dos minutos de movimiento, lectura o foco son suficientes para activar la constancia.',
        image: 'dos-minutos'
    }
]

const currentTip = ref(null)
const visibleHabits = ref([])
const hiddenHabits = ref([])

const filterHabitsByVisibility = async () => {
    const visible = []
    const hidden = []

    for (const habit of habits.value) {
        const shouldShow = await shouldShowHabitForDate(habit, selectedDate.value)
        if (shouldShow) {
            visible.push(habit)
        } else {
            hidden.push(habit)
        }
    }

    visibleHabits.value = visible
    hiddenHabits.value = hidden
}

const handleHabitUpdated = async (updatedHabit) => {
    const habitIndex = habits.value.findIndex(h => h.id === updatedHabit.id)
    if (habitIndex !== -1) {
        habits.value[habitIndex] = updatedHabit

        try {
            const refreshedHabits = await getHabitsForDate(selectedDate.value)
            habits.value = refreshedHabits
        } catch (error) {
            console.error('Error refrescando hábitos:', error)
        }

        await filterHabitsByVisibility()
        await dateNavigatorRef.value?.refreshCompletions()
    }
}

const handleCommunityHabitUpdated = async (habitId) => {
    const index = communityHabits.value.findIndex(item => item.habit.id === habitId)
    if (index === -1) return
    try {
        const freshMembers = await getCommunityHabitCompletions(habitId, selectedDate.value)
        communityHabits.value[index] = { ...communityHabits.value[index], members: freshMembers }
    } catch (error) {
        console.error('Error refrescando miembros del hábito comunitario:', error)
    }
}

watch(selectedDate, async (newDate) => {
    try {
        habits.value = await getHabitsForDate(newDate)
        await filterHabitsByVisibility()

        const updatedItems = []
        for (const item of communityHabits.value) {
            const members = await getCommunityHabitCompletions(item.habit.id, newDate)
            updatedItems.push({ ...item, members })
        }
        communityHabits.value = updatedItems
    } catch (error) {
        console.error('Error cargando hábitos para fecha:', error)
    }
})

let dateCheckInterval = null
let visibilityChangeHandler = null

onMounted(async () => {
    try {
        await authStore.fetchUser()
        console.log('[PAGE INDEX] Usuario autenticado:', authStore.isLoggedIn)

        console.log('[PAGE INDEX] Iniciando sincronización de hábitos...')
        await syncHabitsWithNewDay()
        console.log('[PAGE INDEX] Sincronización completada')

        habits.value = await getHabitsForDate(selectedDate.value)
        console.log('[PAGE INDEX] Hábitos cargados después del reset:', habits.value.map(h => ({ name: h.name, progress: h.progress_count, goal: h.goal_value })))

        await filterHabitsByVisibility()
        isLoading.value = false

        const communities = await getCommunities()
        const items = []
        for (const community of communities) {
            if (!community.habit) continue
            const habit = { ...community.habit, community_id: community.id }
            const members = await getCommunityHabitCompletions(community.habit.id)
            items.push({ habit, members })
        }
        communityHabits.value = items
        isCommunityLoading.value = false
    } catch (error) {
        console.error('Error cargando hábitos:', error)
        isLoading.value = false
        isCommunityLoading.value = false
    }

    if (typeof window !== 'undefined') {
        dateCheckInterval = setInterval(async () => {
            try {
                const today = getArgentineDate()
                const lastCheck = localStorage.getItem('lastHabitResetDate')

                if (lastCheck && lastCheck !== today) {
                    console.log('[PAGE INDEX] Detectado cambio de fecha! Reseteando hábitos...')
                    selectedDate.value = today
                    await syncHabitsWithNewDay()
                    habits.value = await getHabitsForDate(selectedDate.value)
                    console.log('[PAGE INDEX] Hábitos reseteados por cambio de fecha')

                    await filterHabitsByVisibility()
                }
            } catch (error) {
                console.error('[PAGE INDEX] Error en verificación de fecha:', error)
            }
        }, 5 * 60 * 1000)
    }

    if (typeof window !== 'undefined') {
        visibilityChangeHandler = async () => {
            if (document.visibilityState === 'visible') {
                try {
                    habits.value = await getHabitsForDate(selectedDate.value)
                    await filterHabitsByVisibility()
                } catch (error) {
                    console.error('[PAGE INDEX] Error refreshing habits on visibility:', error)
                }
            }
        }
        document.addEventListener('visibilitychange', visibilityChangeHandler)
    }

    if (typeof window !== 'undefined') {
        const savedTip = sessionStorage.getItem('sessionTip')

        if (savedTip) {
            currentTip.value = JSON.parse(savedTip)
        } else {
            const randomIndex = Math.floor(Math.random() * tips.length)
            const selectedTip = tips[randomIndex]
            sessionStorage.setItem('sessionTip', JSON.stringify(selectedTip))
            currentTip.value = selectedTip
        }
        isTipLoading.value = false
    }
})

onUnmounted(() => {
    if (dateCheckInterval) {
        clearInterval(dateCheckInterval)
    }
    if (visibilityChangeHandler && typeof window !== 'undefined') {
        document.removeEventListener('visibilitychange', visibilityChangeHandler)
    }
})

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
    if (!isLoggedIn && typeof window !== 'undefined') {
        sessionStorage.removeItem('sessionTip')
        currentTip.value = null
    }
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s ease;
}

.expand-enter-from {
    opacity: 0;
    max-height: 0;
}

.expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 1000px;
}
</style>