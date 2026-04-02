<template>
    <div class="flex flex-col items-center gap-1">
        <div class="relative">
            <div class="w-10 h-10 flex items-center justify-center rounded-full bg-green-light overflow-hidden">
                <img v-if="member?.avatar_url" :src="member.avatar_url" class="w-full h-full object-cover" />
                <span v-else class="text-xs text-light font-bold">{{ member?.display_name?.charAt(0).toUpperCase()
                    }}</span>
            </div>
            <button type="button" @click="emit('remove', member?.id)"
                class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-gray rounded-full">
                <span class="text-light text-sm font-regular">×</span>
            </button>
        </div>
        <p class="text-[0.625rem] text-dark">{{ member?.display_name }}</p>
    </div>
</template>

<script setup>
defineProps({
    member: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['remove'])
</script>
