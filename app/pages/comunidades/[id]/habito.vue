<template>
    <DefaultSection class="h-full">
        <CommunityHeader :community="community" />

        <!-- Contenido del hábito -->
        <div class="h-full flex flex-col justify-center gap-5">
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 flex items-center justify-center rounded-full bg-green-dark text-2xl">
                    {{ habit?.icon }}
                </div>
                <div class="h-4 flex items-center gap-3 mt-2">
                    <div v-if="habit?.streak > 0" class="flex items-center gap-1">
                        <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                        <p class="text-[0.625rem]">{{ habit.streak }}</p>
                    </div>
                </div>
                <!-- Fila de círculos de miembros -->
                <div class="flex gap-1 items-center">
                    <template v-for="member in completions" :key="member.id">
                        <div
                            class="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center"
                            :class="member.completed ? 'bg-green-dark' : 'bg-gray'">
                            <img
                                v-if="member.completed && member.avatar_url"
                                :src="member.avatar_url"
                                :alt="member.display_name"
                                class="w-full h-full object-cover"
                            />
                        </div>
                    </template>
                </div>
            </div>

            <p class="text-center text-sm">
                Vamos a <span class="font-bold">{{ habit?.name?.toLowerCase() }}</span>
                para ser en <span class="font-bold">{{ habit?.identity?.toLowerCase() || 'mejores personas' }}</span>.
            </p>

            <div>
                <ProgressBar
                    :progress-count="myLog?.progress_count"
                    :goal-value="habit?.goal_value"
                />
                <div class="w-full flex justify-center items-center gap-3 mt-3">
                    <button @click="decreaseProgress" class="h-4 w-4 flex justify-center items-center bg-accent rounded-full text-xs">-</button>
                    <div class="flex items-end gap-2">
                        <p class="text-xl">{{ myLog?.progress_count || 0 }}</p>
                        <p class="text-[0.625rem]/[2] text-gray">/<span>{{ habit?.goal_value || 1 }}</span></p>
                    </div>
                    <button
                        @click="increaseProgress"
                        :disabled="(myLog?.progress_count || 0) >= (habit?.goal_value || 1)"
                        :class="{ 'opacity-50 cursor-not-allowed': (myLog?.progress_count || 0) >= (habit?.goal_value || 1) }"
                        class="h-4 w-4 flex justify-center items-center bg-accent rounded-full text-xs">+</button>
                </div>
            </div>
        </div>

        <!-- Botones de acción -->
        <div class="w-full flex justify-between items-center">
            <button @click="resetProgress" class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/restart.svg" alt="Restablecer" class="w-4" />
            </button>
            <button @click="completeHabit" class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/check.svg" alt="Completar" class="w-3" />
            </button>
        </div>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const { getCommunityById, getCommunityHabit, getCommunityHabitMyLog, getCommunityHabitCompletions, logCommunityHabitProgress } = useCommunities()

const community = ref(null)
const habit = ref(null)
const myLog = ref(null)
const completions = ref([])

const loadData = async () => {
    const communityId = route.params.id
    const [communityData, habitData] = await Promise.all([
        getCommunityById(communityId),
        getCommunityHabit(communityId),
    ])
    community.value = communityData
    habit.value = habitData
    if (!habitData) return

    const [logData, completionsData] = await Promise.all([
        getCommunityHabitMyLog(habitData.id),
        getCommunityHabitCompletions(habitData.id),
    ])
    myLog.value = logData
    completions.value = completionsData
}

const increaseProgress = async () => {
    try {
        myLog.value = await logCommunityHabitProgress(habit.value.id, 1, habit.value.goal_value)
        completions.value = await getCommunityHabitCompletions(habit.value.id)
    } catch (error) {
        console.error('Error actualizando progreso:', error)
    }
}

const decreaseProgress = async () => {
    try {
        myLog.value = await logCommunityHabitProgress(habit.value.id, -1, habit.value.goal_value)
        completions.value = await getCommunityHabitCompletions(habit.value.id)
    } catch (error) {
        console.error('Error actualizando progreso:', error)
    }
}

const resetProgress = async () => {
    try {
        const current = myLog.value?.progress_count || 0
        if (current > 0) {
            myLog.value = await logCommunityHabitProgress(habit.value.id, -current, habit.value.goal_value)
            completions.value = await getCommunityHabitCompletions(habit.value.id)
        }
    } catch (error) {
        console.error('Error reiniciando progreso:', error)
    }
}

const completeHabit = async () => {
    try {
        const current = myLog.value?.progress_count || 0
        const goal = habit.value.goal_value || 1
        const needed = goal - current
        if (needed > 0) {
            myLog.value = await logCommunityHabitProgress(habit.value.id, needed, goal)
            completions.value = await getCommunityHabitCompletions(habit.value.id)
        }
    } catch (error) {
        console.error('Error completando hábito:', error)
    }
}

onMounted(loadData)
</script>
