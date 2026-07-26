<template>
    <div class="w-full">
        <div class="flex justify-between items-start w-full">
            <button
                v-for="day in days"
                :key="day.dateStr"
                @click="selectDay(day.dateStr)"
                :class="[
                    'flex-col items-center gap-1 flex-1',
                    day.isPreviousWeeks ? 'hidden 2xl:flex' : 'flex'
                ]"
            >
                <p class="text-xs text-gray">{{ day.label }}</p>
                <div class="relative w-9 h-9 flex items-center justify-center">
                    <svg
                        class="absolute inset-0 w-full h-full text-primary -rotate-90"
                        viewBox="0 0 36 36"
                    >
                        <circle
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            :stroke="day.dateStr > TODAY ? '#E5E7EB' : '#D1D5DB'"
                            stroke-width="1.5"
                            :stroke-dasharray="CIRCUMFERENCE"
                            stroke-dashoffset="0"
                        />
                        <circle
                            v-if="getCompletionRatio(day.dateStr) > 0"
                            cx="18"
                            cy="18"
                            r="15"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            :stroke-dasharray="CIRCUMFERENCE"
                            :stroke-dashoffset="getStrokeDashOffset(day.dateStr)"
                        />
                    </svg>
                    <div
                        :class="[
                            'w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                            isSelected(day.dateStr)
                                ? 'bg-accent text-green-dark'
                                : isToday(day.dateStr)
                                    ? 'border border-green-dark text-green-dark'
                                    : day.dateStr > TODAY
                                        ? 'text-gray opacity-50'
                                        : 'text-dark'
                        ]"
                    >
                        <p class="text-xs font-medium">{{ day.number }}</p>
                    </div>
                </div>
            </button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['update:modelValue'])

const client = useSupabaseClient()

const dayCompletions = ref({})

const CIRCUMFERENCE = 2 * Math.PI * 15

const TODAY = getArgentineDate()

const DAY_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

const DAYS_MOBILE = 7
const DAYS_DESKTOP = 14

const days = computed(() => {
    return Array.from({ length: DAYS_DESKTOP }, (_, i) => {
        const dateStr = addDaysToDateStr(TODAY, i - (DAYS_DESKTOP - 1))
        const [, , dayNum] = dateStr.split('-').map(Number)
        const [year, month, day] = dateStr.split('-').map(Number)
        const dayOfWeek = new Date(year, month - 1, day).getDay()
        return {
            dateStr,
            label: DAY_LABELS[dayOfWeek],
            number: dayNum,
            isPreviousWeeks: i < DAYS_DESKTOP - DAYS_MOBILE
        }
    })
})

const fetchCommunityHabits = async (userId, dates) => {
    const { data: memberships } = await client
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId)

    const communityIds = (memberships || []).map(m => m.community_id)
    if (communityIds.length === 0) return { habits: [], logs: [] }

    const { data: habits } = await client
        .from('community_habits')
        .select('id, frequency_type, frequency_option, frequency_detail')
        .in('community_id', communityIds)

    if (!habits || habits.length === 0) return { habits: [], logs: [] }

    const { data: logs } = await client
        .from('community_habit_logs')
        .select('date, community_habit_id')
        .in('date', dates)
        .in('community_habit_id', habits.map(h => h.id))
        .eq('user_id', userId)
        .eq('completed', true)

    return { habits, logs: logs || [] }
}

const fetchWeekCompletions = async () => {
    const { data: { session } } = await client.auth.getSession()
    const userId = session?.user?.id
    if (!userId) return

    const pastAndTodayDates = days.value
        .map(d => d.dateStr)
        .filter(d => d <= TODAY)

    if (pastAndTodayDates.length === 0) return

    const { data: habits } = await client
        .from('habits')
        .select('id, frequency_type, frequency_option, frequency_detail')
        .eq('user_id', userId)

    const personalHabits = habits || []

    const { data: logs } = personalHabits.length > 0
        ? await client
            .from('habit_logs')
            .select('date, habit_id')
            .in('date', pastAndTodayDates)
            .in('habit_id', personalHabits.map(h => h.id))
            .eq('completed', true)
        : { data: [] }

    const { habits: communityHabits, logs: communityLogs } = await fetchCommunityHabits(userId, pastAndTodayDates)

    if (personalHabits.length === 0 && communityHabits.length === 0) return

    const countPerDay = {}
    for (const log of [...(logs || []), ...communityLogs]) {
        countPerDay[log.date] = (countPerDay[log.date] || 0) + 1
    }

    const allHabits = [...personalHabits, ...communityHabits]

    const result = {}
    pastAndTodayDates.forEach(date => {
        const total = allHabits.filter(h => isHabitScheduledOn(h, date)).length
        result[date] = { completed: countPerDay[date] || 0, total }
    })
    dayCompletions.value = result
}

const getCompletionRatio = (dateStr) => {
    if (dateStr > TODAY) return 0
    const data = dayCompletions.value[dateStr]
    if (!data || data.total === 0) return 0
    return Math.min(data.completed / data.total, 1)
}

const getStrokeDashOffset = (dateStr) => {
    const ratio = getCompletionRatio(dateStr)
    return CIRCUMFERENCE * (1 - ratio)
}

onMounted(fetchWeekCompletions)

defineExpose({ refreshCompletions: fetchWeekCompletions })

const isSelected = (dateStr) => props.modelValue === dateStr
const isToday = (dateStr) => dateStr === TODAY

const selectDay = (dateStr) => {
    emit('update:modelValue', dateStr)
}

</script>
