<template>
    <component
        :is="selectable ? 'div' : NuxtLink"
        v-bind="selectable ? {} : { to: `/usuarios/${friend?.id}` }"
        class="w-full flex items-center justify-between bg-midlight rounded-lg p-3"
    >
        <div class="flex gap-3 items-center">
            <div class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-green-light flex-shrink-0">
                <img v-if="friend?.avatar_url" :src="friend.avatar_url" :alt="friend.display_name" class="w-full h-full object-cover" />
                <span v-else class="text-[0.5rem] text-light font-bold">{{ friend?.display_name?.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="flex items-center gap-1">
                <p class="text-xs">{{ friend?.display_name }}</p>
                <span v-if="badge" class="text-[0.6rem] text-primary font-semibold">({{ badge }})</span>
            </div>
        </div>
        <button
            v-if="selectable"
            type="button"
            @click="!disabled && emit('toggle', friend?.id)"
            :class="['w-6 h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0', selected ? 'bg-primary border border-primary' : 'border border-gray']"
        >
            <NuxtImg v-if="selected" src="/images/brillo-blanco.svg" class="w-3 h-3" />
            <NuxtImg v-else src="/images/brillo.svg" class="w-3 h-3" />
        </button>
    </component>
</template>

<script setup>
import { NuxtLink } from '#components'

const props = defineProps({
    friend: {
        type: Object,
        required: true
    },
    selectable: {
        type: Boolean,
        default: false
    },
    selected: {
        type: Boolean,
        default: false
    },
    disabled: {
        type: Boolean,
        default: false
    },
    badge: {
        type: String,
        default: ''
    }
})

const emit = defineEmits(['toggle'])
</script>
