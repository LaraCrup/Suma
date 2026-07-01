<template>
    <div class="w-full">
        <div class="flex justify-between items-start w-full">
            <button
                v-for="day in days"
                :key="day.dateStr"
                @click="selectDay(day.dateStr)"
                class="flex flex-col items-center gap-1 flex-1"
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
                        <!-- Arco de progreso encima, solo si hay completion -->
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

const TODAY = (() => {
    const formatter = new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    const parts = formatter.formatToParts(new Date())
    const year = parts.find(p => p.type === 'year').value
    const month = parts.find(p => p.type === 'month').value
    const day = parts.find(p => p.type === 'day').value
    return `${year}-${month}-${day}`
})()

const DAY_LABELS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

const addDays = (dateStr, n) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d + n)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const days = computed(() => {
    return Array.from({ length: 7 }, (_, i) => {
        const dateStr = addDays(TODAY, i - 6)
        const [, , dayNum] = dateStr.split('-').map(Number)
        const [year, month, day] = dateStr.split('-').map(Number)
        const dayOfWeek = new Date(year, month - 1, day).getDay()
        return {
            dateStr,
            label: DAY_LABELS[dayOfWeek],
            number: dayNum
        }
    })
})

const DAY_LETTER_TO_NUM = { D: 0, L: 1, M: 2, X: 3, J: 4, V: 5, S: 6 }

const isHabitApplicableForDate = (habit, dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const dateObj = new Date(year, month - 1, day)
    const dayOfWeek = dateObj.getDay()
    const dayOfMonth = dateObj.getDate()
    const fo = habit.frequency_option

    // La opción define en qué días aplica, independientemente de la frecuencia (type).
    if (fo === 'dias_especificos_semana') {
        const selected = (habit.frequency_detail?.weekDays || []).map(l => DAY_LETTER_TO_NUM[l])
        return selected.includes(dayOfWeek)
    }
    if (fo === 'dias_especificos_mes') {
        return (habit.frequency_detail?.monthDays || []).includes(dayOfMonth)
    }

    // todos / cantidad_dias_semana / cantidad_dias_mes / sin opción: aplica cualquier día del período
    return true
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

    if (!habits || habits.length === 0) return

    const habitIds = habits.map(h => h.id)

    const { data: logs } = await client
        .from('habit_logs')
        .select('date, habit_id')
        .in('date', pastAndTodayDates)
        .in('habit_id', habitIds)
        .eq('completed', true)

    const countPerDay = {}
    logs?.forEach(log => {
        countPerDay[log.date] = (countPerDay[log.date] || 0) + 1
    })

    const result = {}
    pastAndTodayDates.forEach(date => {
        const total = habits.filter(h => isHabitApplicableForDate(h, date)).length
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
