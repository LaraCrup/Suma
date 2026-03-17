<template>
    <NuxtLink :to="`/usuarios/${friend?.id}`" class="w-full flex items-center justify-between bg-midlight rounded-lg p-3">
        <div class="flex gap-3 items-center">
            <div class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-green-light flex-shrink-0">
                <img v-if="friend?.avatar_url" :src="friend.avatar_url" :alt="friend.display_name" class="w-full h-full object-cover" />
                <span v-else class="text-[0.5rem] text-light font-bold">{{ friend?.display_name?.charAt(0).toUpperCase() }}</span>
            </div>
            <p class="text-xs">{{ friend?.display_name }}</p>
        </div>
    </NuxtLink>
</template>

<script setup>
defineProps({
    friend: {
        type: Object,
        required: true
    }
})
</script>
