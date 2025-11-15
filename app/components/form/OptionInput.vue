<template>
    <div v-if="isCounter" class="w-full flex flex-col items-center gap-2">
        <div class="w-full flex items-center justify-between rounded-lg bg-midlight px-3 py-2">
            <span class="text-dark text-xs">{{ variant }}</span>
            <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center border transition-colors cursor-pointer',
                isSelected
                    ? 'bg-green-light border-green-light'
                    : 'border-gray'
            ]" @click="$emit('click')">
                <NuxtImg :src="isSelected ? '/images/brillo-blanco.svg' : '/images/brillo.svg'" class="w-3 h-3" />
            </div>
        </div>
        <FormCounter
            v-if="isSelected"
            :model-value="counterValue"
            :max="max"
            @update:model-value="$emit('update:counterValue', $event)"
        />
    </div>
    <div v-else-if="isWeekDays" class="w-full flex flex-col items-center gap-2">
        <div class="w-full flex items-center justify-between rounded-lg bg-midlight px-3 py-2">
            <span class="text-dark text-xs">{{ variant }}</span>
            <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center border transition-colors cursor-pointer',
                isSelected
                    ? 'bg-green-light border-green-light'
                    : 'border-gray'
            ]" @click="$emit('click')">
                <NuxtImg :src="isSelected ? '/images/brillo-blanco.svg' : '/images/brillo.svg'" class="w-3 h-3" />
            </div>
        </div>
        <div v-if="isSelected" class="w-full grid grid-cols-7 gap-1">
            <button
                v-for="day in weekDays"
                :key="day.key"
                @click="toggleWeekDay(day.key)"
                :class="[
                    'w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full transition-colors flex-1',
                    selectedWeekDays.includes(day.key)
                        ? 'bg-green-light text-light'
                        : 'bg-light text-gray border border-gray'
                ]"
            >
                {{ day.label }}
            </button>
        </div>
    </div>
    <div v-else-if="isMonthDays" class="w-full flex flex-col items-center gap-2">
        <div class="w-full flex items-center justify-between rounded-lg bg-midlight px-3 py-2">
            <span class="text-dark text-xs">{{ variant }}</span>
            <div :class="[
                'w-6 h-6 rounded-full flex items-center justify-center border transition-colors cursor-pointer',
                isSelected
                    ? 'bg-green-light border-green-light'
                    : 'border-gray'
            ]" @click="$emit('click')">
                <NuxtImg :src="isSelected ? '/images/brillo-blanco.svg' : '/images/brillo.svg'" class="w-3 h-3" />
            </div>
        </div>
        <div v-if="isSelected" class="w-full grid grid-cols-7 gap-1">
            <button
                v-for="day in monthDays"
                :key="day"
                @click="toggleMonthDay(day)"
                :class="[
                    'w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full transition-colors flex-1',
                    selectedMonthDays.includes(day)
                        ? 'bg-green-light text-light'
                        : 'bg-gray-light text-dark border border-gray'
                ]"
            >
                {{ day }}
            </button>
        </div>
    </div>
    <div v-else class="flex items-center justify-between rounded-lg bg-midlight px-3 py-2 cursor-pointer" @click="$emit('click')">
        <span class="text-dark text-xs">{{ variant }}</span>
        <div :class="[
            'w-6 h-6 rounded-full flex items-center justify-center border transition-colors',
            isSelected
                ? 'bg-green-light border-green-light'
                : 'border-gray'
        ]">
            <NuxtImg :src="isSelected ? '/images/brillo-blanco.svg' : '/images/brillo.svg'" class="w-3 h-3" />
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    variant: {
        type: String,
        required: true
    },
    isSelected: {
        type: Boolean,
        default: false
    },
    counterValue: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: null
    },
    weekDaysSelected: {
        type: Array,
        default: () => []
    },
    monthDaysSelected: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['click', 'update:counterValue', 'update:weekDaysSelected', 'update:monthDaysSelected'])

const weekDays = ref([
    { key: 'L', label: 'L' },
    { key: 'M', label: 'M' },
    { key: 'X', label: 'X' },
    { key: 'J', label: 'J' },
    { key: 'V', label: 'V' },
    { key: 'S', label: 'S' },
    { key: 'D', label: 'D' }
])

const monthDays = computed(() => {
    return Array.from({ length: 31 }, (_, i) => i + 1)
})

const selectedWeekDays = computed({
    get: () => props.weekDaysSelected,
    set: (value) => emit('update:weekDaysSelected', value)
})

const selectedMonthDays = computed({
    get: () => props.monthDaysSelected,
    set: (value) => emit('update:monthDaysSelected', value)
})

const isCounter = computed(() => {
    return props.variant && props.variant.toLowerCase().startsWith('cantidad de')
})

const isWeekDays = computed(() => {
    return props.variant && props.variant.toLowerCase().includes('dias especificos de la semana')
})

const isMonthDays = computed(() => {
    return props.variant && props.variant.toLowerCase().includes('dias especificos del mes')
})

const toggleWeekDay = (day) => {
    const updated = selectedWeekDays.value.includes(day)
        ? selectedWeekDays.value.filter(d => d !== day)
        : [...selectedWeekDays.value, day]
    selectedWeekDays.value = updated
}

const toggleMonthDay = (day) => {
    const updated = selectedMonthDays.value.includes(day)
        ? selectedMonthDays.value.filter(d => d !== day)
        : [...selectedMonthDays.value, day]
    selectedMonthDays.value = updated
}
</script>