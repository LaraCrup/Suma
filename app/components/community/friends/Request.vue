<template>
    <div class="w-full flex items-center justify-between bg-midlight rounded-lg p-3">
        <div class="flex gap-3 items-center">
            <div class="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-green-light flex-shrink-0">
                <img v-if="request?.sender?.avatar_url" :src="request.sender.avatar_url" :alt="request.sender.display_name" class="w-full h-full object-cover" />
                <span v-else class="text-[0.5rem] text-light font-bold">{{ request?.sender?.display_name?.charAt(0).toUpperCase() }}</span>
            </div>
            <p class="text-xs">{{ request?.sender?.display_name }}</p>
        </div>
        <div class="flex gap-1">
            <button @click="handleAccept" class="w-5 h-5 flex justify-center items-center rounded-full bg-green-light">
                <NuxtImg src="/images/icons/check.svg" alt="Aceptar" class="h-2" />
            </button>
            <button @click="handleDecline" class="w-5 h-5 flex justify-center items-center rounded-full bg-error">
                <svg class="w-[0.925rem] h-[0.925rem] text-light font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    request: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['accepted', 'declined'])

const { acceptFriendRequest, declineFriendRequest } = useFriends()

const handleAccept = async () => {
    try {
        await acceptFriendRequest(props.request.id)
        emit('accepted', props.request.id)
    } catch (e) {
        console.error('Error aceptando solicitud:', e)
    }
}

const handleDecline = async () => {
    try {
        await declineFriendRequest(props.request.id)
        emit('declined', props.request.id)
    } catch (e) {
        console.error('Error rechazando solicitud:', e)
    }
}
</script>
