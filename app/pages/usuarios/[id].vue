<template>
    <DefaultSection>
        <div class="relative w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit" color="text-gray" />
            <h1 class="absolute top-0 left-1/2 -translate-x-1/2 text-sm font-bold">{{ profile?.display_name ?? '...' }}</h1>
        </div>

        <Loader v-if="loading" color="primary" />

        <div v-else-if="notFound" class="w-full text-center">
            <p class="text-sm text-gray">Este usuario no existe o fue eliminado.</p>
        </div>

        <template v-else>
            <div class="flex flex-col items-center gap-3">
                <Avatar :name="profile.display_name" :initial="profile.display_name?.charAt(0).toUpperCase()"
                    :image="profile.avatar_url" />
                <div class="flex items-center gap-2">
                    <p class="text-xs text-dark">Nivel</p><span
                        class="w-5 h-5 flex justify-center items-center bg-green-dark text-light font-bold text-[0.625rem] rounded-full">
                        {{ profile.current_level }}
                    </span>
                </div>
            </div>

            <div class="w-full grid grid-cols-2 gap-3">
                <div>
                    <p class="text-xs">Hábitos activos</p>
                    <p class="text-base font-bold text-primary mt-1">{{ habitCount }}</p>
                </div>
                <div>
                    <p class="text-xs">Comunidades</p>
                    <p class="text-base font-bold text-primary mt-1">{{ communityCount }}</p>
                </div>
                <div>
                    <p class="text-xs">Amigos</p>
                    <p class="text-base font-bold text-primary mt-1">{{ friendCount }}</p>
                </div>
            </div>

            <div class="w-full flex flex-col gap-2">
                <ButtonTerciary v-if="isFriend" type="button" :disabled="actionLoading"
                    @click="showRemoveConfirmation = true">
                    Eliminar amigo
                </ButtonTerciary>
                <ButtonTerciary v-else-if="isPending" type="button" :disabled="actionLoading" @click="handleCancelRequest">
                    Solicitud pendiente
                </ButtonTerciary>
                <ButtonPrimary v-else type="button" :disabled="actionLoading" @click="handleAddFriend">
                    Agregar amigo
                </ButtonPrimary>
            </div>
        </template>
    </DefaultSection>

    <Transition name="fade">
        <div v-if="showRemoveConfirmation" class="fixed inset-0 z-40 bg-dark bg-opacity-50"
            @click="showRemoveConfirmation = false"></div>
    </Transition>
    <Transition name="slide-up">
        <div v-if="showRemoveConfirmation" class="fixed inset-0 z-50 flex items-end">
            <div class="relative w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl p-5 pb-6">
                <button @click="showRemoveConfirmation = false" class="absolute top-4 right-4 text-gray">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <p class="text-center text-sm">¿Estás seguro de que deseas eliminar a {{ profile?.display_name }} de tus
                    amigos?
                </p>
                <div class="w-full flex flex-col items-center gap-2">
                    <ButtonPrimary type="button" :disabled="actionLoading" @click="handleRemoveFriend">
                        Sí, eliminar amigo
                    </ButtonPrimary>
                    <ButtonTerciary type="button" @click="showRemoveConfirmation = false">Cancelar</ButtonTerciary>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/authStore'
import { useFriends } from '~/composables/useFriends'
const route = useRoute()
const authStore = useAuthStore()
const client = useSupabaseClient()
const { getProfileById, getFriendIds, getSentPendingIds, sendFriendRequest, cancelFriendRequest, removeFriend } = useFriends()

const loading = ref(true)
const notFound = ref(false)
const actionLoading = ref(false)
const showRemoveConfirmation = ref(false)

const profile = ref(null)
const habitCount = ref(0)
const friendCount = ref(0)
const communityCount = ref(0)
const isFriend = ref(false)
const isPending = ref(false)
onMounted(async () => {
    const targetId = route.params.id

    await authStore.fetchUser()
    if (authStore.user?.id === targetId) {
        return navigateTo('/mi-perfil')
    }

    try {
        const profileData = await getProfileById(targetId)
        if (!profileData) {
            notFound.value = true
            return
        }
        profile.value = profileData

        const [habitsResult, friendsResult, communitiesResult, friendIds, pendingIds] = await Promise.all([
            client
                .from('habits')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', targetId),
            client
                .from('friend_requests')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'accepted')
                .or(`sender_id.eq.${targetId},receiver_id.eq.${targetId}`),
            client
                .from('community_members')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', targetId),
            getFriendIds(),
            getSentPendingIds()
        ])

        habitCount.value = habitsResult.count ?? 0
        friendCount.value = friendsResult.count ?? 0
        communityCount.value = communitiesResult.count ?? 0
        isFriend.value = friendIds.includes(targetId)
        isPending.value = pendingIds.includes(targetId)

    } catch (err) {
        console.error('Error cargando perfil de usuario:', err)
        notFound.value = true
    } finally {
        loading.value = false
    }
})

const handleAddFriend = async () => {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
        await sendFriendRequest(profile.value.id)
        isPending.value = true
    } catch (err) {
        console.error('Error enviando solicitud:', err)
    } finally {
        actionLoading.value = false
    }
}

const handleCancelRequest = async () => {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
        await cancelFriendRequest(profile.value.id)
        isPending.value = false
    } catch (err) {
        console.error('Error cancelando solicitud:', err)
    } finally {
        actionLoading.value = false
    }
}

const handleRemoveFriend = async () => {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
        await removeFriend(profile.value.id)
        isFriend.value = false
        friendCount.value = Math.max(0, friendCount.value - 1)
        showRemoveConfirmation.value = false
    } catch (err) {
        console.error('Error eliminando amigo:', err)
    } finally {
        actionLoading.value = false
    }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
}
</style>
