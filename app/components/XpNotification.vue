<template>
    <Transition name="xp-toast">
        <div v-if="store.visible && store.current"
            class="fixed top-8 right-4 z-[9999] w-64 rounded-2xl overflow-hidden shadow-2xl">

            <!-- Level up -->
            <template v-if="store.current.type === 'level_up'">
                <div class="bg-green-dark p-3 flex items-center gap-3">
                    <div class="w-6 h-6 flex justify-center items-center rounded-full border-gray border-[1px]">
                        <NuxtImg src="/images/brillo.svg" alt="Nivel" class="w-3" />
                    </div>
                    <div class="flex flex-col">
                        <span class="font-montserrat font-medium text-md leading-tight text-accent">
                            ¡Subiste de nivel!
                        </span>
                        <span class="text-light text-xs leading-snug">
                            Nivel {{ store.current.level }} alcanzado
                        </span>
                    </div>
                </div>
            </template>

            <!-- XP ganado -->
            <template v-else>
                <div class="bg-green-dark p-3 flex items-center gap-3">
                    <div class="w-6 h-6 flex justify-center items-center rounded-full border-gray border-[1px]">
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-3" />
                    </div>
                    <div class="flex flex-col">
                        <span class="font-montserrat font-medium text-md leading-tight text-accent">
                            + {{ store.current.xpAmount }} XP
                        </span>
                        <span class="text-light text-xs leading-snug">
                            {{ label }}
                        </span>
                    </div>
                </div>
            </template>

            <div class="h-[3px] bg-green-dark">
                <div class="h-full bg-accent timer-bar" :key="timerKey"></div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
const store = useXpNotificationStore()

const ACTION_LABELS = {
    habit_completed: '¡Hábito completado!',
    streak_7: '¡Racha de 7 días!',
    streak_14: '¡Racha de 14 días!',
    streak_30: '¡Racha de 30 días!',
    streak_60: '¡Racha de 60 días!',
    streak_100: '¡Racha de 100 días!',
    all_habits_daily: '¡Todos los hábitos del día!',
    weekly_goal_met: '¡Meta semanal cumplida!',
    first_habit_created: '¡Primer hábito creado!',
    comeback: '¡Bienvenido de vuelta!',
    community_habit_completed: '¡Hábito comunitario!',
    create_community: '¡Comunidad creada!',
    join_community: '¡Nueva comunidad!',
    friend_added: '¡Nuevo amigo!',
}

const label = computed(() => {
    const key = store.current?.actionKey
    return ACTION_LABELS[key] ?? '¡XP obtenido!'
})

let timer = null
const timerKey = ref(0)

watch(() => store.visible, (val) => {
    clearTimeout(timer)
    if (val) {
        timerKey.value++
        timer = setTimeout(() => store.dismiss(), 5000)
    }
})
</script>

<style scoped>
.xp-toast-enter-active {
    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease;
}

.xp-toast-leave-active {
    transition: transform 0.3s ease-in, opacity 0.3s ease-in;
}

.xp-toast-enter-from,
.xp-toast-leave-to {
    transform: translateX(110%);
    opacity: 0;
}

.timer-bar {
    width: 100%;
    animation: shrink 5s linear forwards;
}

@keyframes shrink {
    from {
        width: 100%;
    }

    to {
        width: 0%;
    }
}
</style>
