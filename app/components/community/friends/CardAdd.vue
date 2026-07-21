<template>
    <div class="w-full flex items-center justify-between bg-midlight rounded-lg p-3 2xl:p-4">
        <NuxtLink :to="`/usuarios/${user?.id}`" class="flex gap-3 items-center">
            <div class="w-6 2xl:w-7 h-6 2xl:h-7 rounded-full overflow-hidden flex items-center justify-center bg-green-light flex-shrink-0">
                <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user.display_name" class="w-full h-full object-cover" />
                <span v-else class="text-[0.5rem] 2xl:text-sm text-light font-bold">{{ user?.display_name?.charAt(0).toUpperCase() }}</span>
            </div>
            <p class="text-xs 2xl:text-sm">{{ user?.display_name }}</p>
        </NuxtLink>
        <div class="relative flex items-center justify-end" style="min-width: 2.5rem;">
            <NuxtImg v-if="isFriend" src="/images/brillo.svg" class="w-4 h-4 flex-shrink-0" />
            <Transition v-else name="toggle">
                <button
                    v-if="!isPending"
                    key="add"
                    @click.prevent="handleSendRequest"
                    class="absolute w-5 2xl:w-6 h-5 2xl:h-6 flex justify-center items-center rounded-full border-green-light border-[1px]"
                >
                    <span class="text-green-light font-bold text-xs 2xl:text-sm">+</span>
                </button>
                <button
                    v-else
                    key="pending"
                    @click.prevent="handleCancelRequest"
                    class="absolute right-0 text-xs 2xl:text-sm text-green-dark font-medium border border-green-dark rounded-full px-2 2xl:px-3 py-[2px]"
                >Pendiente</button>
            </Transition>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    user: {
        type: Object,
        required: true
    },
    isPending: {
        type: Boolean,
        default: false
    },
    isFriend: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['request-sent', 'request-cancelled'])

const { sendFriendRequest, cancelFriendRequest } = useFriends()

const handleSendRequest = async () => {
    try {
        await sendFriendRequest(props.user.id)
        emit('request-sent', props.user.id)
    } catch (e) {
        console.error('Error enviando solicitud:', e)
    }
}

const handleCancelRequest = async () => {
    try {
        await cancelFriendRequest(props.user.id)
        emit('request-cancelled', props.user.id)
    } catch (e) {
        console.error('Error cancelando solicitud:', e)
    }
}
</script>

<style scoped>
.toggle-enter-active,
.toggle-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.toggle-enter-from {
    opacity: 0;
    transform: scale(0.7);
}

.toggle-leave-to {
    opacity: 0;
    transform: scale(0.7);
}
</style>
