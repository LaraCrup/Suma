<template>
    <DefaultSection>
        <div v-if="isLoading" class="w-full flex justify-center py-10">
            <Loader color="primary" />
        </div>
        <template v-else>
        <div class="w-full">
            <NavigationBackArrow color="text-gray" />
        </div>

        <div class="w-full flex gap-4">
            <div class="w-12 2xl:w-16 h-12 2xl:h-16 flex items-center justify-center bg-green-dark rounded-full flex-shrink-0">
                <p class="text-3xl 2xl:text-4xl">{{ community?.icon }}</p>
            </div>
            <div class="w-full">
                <FormTextField
                    id="community-name"
                    v-model="editedName"
                    label="Nombre de la comunidad"
                    :readonly="!isAdmin"
                    @focus="isEditingName = true"
                    @blur="saveName"
                    @keyup-enter="$event.target.blur()"
                    @keyup-escape="cancelEditName"
                >
                    <template v-if="isAdmin" #icon>
                        <NuxtImg src="/images/icons/edit.svg" alt="Editar nombre"
                            class="w-4 absolute left-4 top-1/2 -translate-y-1/2" />
                    </template>
                </FormTextField>
            </div>
        </div>

        <div v-if="habit" class="w-full">
            <HabitsCommunityCard :habit="habit" :members="completions" />
        </div>

        <div class="w-full flex flex-col gap-2">
            <div class="flex justify-between items-center">
                <p class="text-sm text-dark">Miembros: {{ community?.member_count }}</p>
                <button v-if="isAdmin" @click="showEditMembers = true" class="w-6 h-6 flex items-center justify-center">
                    <NuxtImg src="/images/icons/edit.svg" alt="Editar miembros" class="w-4 2xl:w-6" />
                </button>
            </div>
            <div class="w-full flex flex-col gap-2">
                <CommunityFriendsCard v-for="member in community?.members" :key="member.profile.id"
                    :friend="member.profile" :badge="member.role === 'admin' ? 'Admin' : ''" />
            </div>
        </div>

        <ButtonSecondary @click="showLeaveCommunity = true" class="mt-2">
            Salir de la comunidad
        </ButtonSecondary>

        <button v-if="isAdmin" @click="showDeleteCommunity = true"
            class="flex items-center gap-2 text-sm text-red-500">
            <NuxtImg src="/images/icons/delete.svg" alt="Eliminar" class="w-4" />
            Eliminar comunidad
        </button>


        <Transition name="fade">
            <div v-if="showEditMembers" class="fixed inset-0 z-40 bg-dark bg-opacity-50"
                @click="showEditMembers = false"></div>
        </Transition>
        <Transition name="pop-up">
            <div v-if="showEditMembers" class="fixed inset-0 z-50 flex items-end 2xl:items-center justify-center">
                <div
                    class="relative 2xl:max-w-[480px] w-full flex flex-col gap-4 bg-light rounded-t-3xl 2xl:rounded-3xl p-5 pb-6 max-h-[80vh] overflow-y-auto">
                    <button @click="showEditMembers = false" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <p class="text-sm font-medium text-dark">Agregá o eliminá miembros</p>

                    <button @click="openAddMembers"
                        class="flex items-center gap-2 bg-primary text-light text-xs rounded-full px-4 py-2 w-fit">
                        <span class="text-base leading-none">+</span>
                        Agregar miembros
                    </button>

                    <div class="flex flex-col gap-2">
                        <div v-for="member in editableMembers" :key="member.profile.id"
                            class="w-full flex items-center justify-between rounded-lg bg-midlight px-3 py-2">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 rounded-full bg-gray flex items-center justify-center overflow-hidden">
                                    <img v-if="member.profile.avatar_url" :src="member.profile.avatar_url"
                                        :alt="member.profile.display_name" class="w-full h-full object-cover" />
                                    <span v-else class="text-xs text-light font-bold">
                                        {{ member.profile.display_name?.[0]?.toUpperCase() }}
                                    </span>
                                </div>
                                <div class="flex items-center gap-1">
                                    <p class="text-xs text-dark">{{ member.profile.display_name }}</p>
                                    <span v-if="member.role === 'admin'" class="text-xs text-primary font-semibold">(Admin)</span>
                                </div>
                            </div>
                            <button v-if="member.role !== 'admin'" @click="askRemoveMember(member)" class="w-6 h-6 flex items-center justify-center">
                                <NuxtImg src="/images/icons/delete.svg" alt="Eliminar miembro" class="w-4" />
                            </button>
                        </div>
                    </div>

                    <ButtonPrimary @click="showEditMembers = false" class="self-center">Guardar</ButtonPrimary>
                </div>
            </div>
        </Transition>

        <Transition name="fade">
            <div v-if="showAddMembers" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="showAddMembers = false">
            </div>
        </Transition>
        <Transition name="pop-up">
            <div v-if="showAddMembers" class="fixed inset-0 z-50 flex items-end 2xl:items-center justify-center">
                <div
                    class="relative 2xl:max-w-[480px] w-full flex flex-col gap-4 bg-light rounded-t-3xl 2xl:rounded-3xl p-5 pb-6 max-h-[80vh] overflow-y-auto">
                    <button @click="showAddMembers = false" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <p class="text-sm font-medium text-dark">Agregá miembros</p>

                    <div class="relative w-full">
                        <NuxtImg src="/images/icons/search.svg" alt="Buscar"
                            class="w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input v-model="searchQuery" type="text" placeholder="Escribí acá..."
                            class="w-full h-10 bg-midlight text-xs text-dark focus:outline-none rounded-lg border-[1px] border-solid border-gray pl-9 pr-3" />
                    </div>

                    <div class="flex flex-col gap-2">
                        <CommunityFriendsCard v-for="friend in filteredFriendsToAdd" :key="friend.id" :friend="friend"
                            :selectable="true"
                            :selected="currentMemberIds.includes(friend.id) || selectedToAdd.includes(friend.id)"
                            :disabled="currentMemberIds.includes(friend.id)"
                            @toggle="toggleAddMember" />
                        <p v-if="filteredFriendsToAdd.length === 0" class="text-xs text-gray text-center py-2">
                            No tenés amigos para agregar.
                        </p>
                    </div>

                    <ButtonPrimary :disabled="selectedToAdd.length === 0 || isSaving" @click="saveNewMembers"  class="self-center">Guardar
                    </ButtonPrimary>
                </div>
            </div>
        </Transition>

        <Transition name="fade">
            <div v-if="memberToRemove" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="memberToRemove = null">
            </div>
        </Transition>
        <Transition name="pop-up">
            <div v-if="memberToRemove" class="fixed inset-0 z-50 flex items-end 2xl:items-center justify-center">
                <div class="relative 2xl:max-w-[480px] w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl 2xl:rounded-3xl p-5 pb-6">
                    <button @click="memberToRemove = null" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div class="w-full flex flex-col items-center gap-3">
                        <div class="w-9 h-9 flex justify-center items-center bg-gradient-secondary rounded-full">
                            <NuxtImg src="/images/icons/delete-accent.svg" alt="Icono Borrar" class="w-3" />
                        </div>
                        <p class="text-center text-sm">
                            ¿Estás seguro de que querés eliminar a
                            <strong>{{ memberToRemove?.profile?.display_name }}</strong>
                            de esta comunidad?
                        </p>
                    </div>
                    <p v-if="removeError" class="text-xs text-red-500 text-center">{{ removeError }}</p>
                    <div class="w-full flex flex-col items-center gap-2">
                        <ButtonPrimary :disabled="isSaving" @click="confirmRemoveMember">Sí, eliminar</ButtonPrimary>
                        <ButtonTerciary @click="memberToRemove = null">Cancelar</ButtonTerciary>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="fade">
            <div v-if="showLeaveCommunity" class="fixed inset-0 z-40 bg-dark bg-opacity-50"
                @click="showLeaveCommunity = false"></div>
        </Transition>
        <Transition name="pop-up">
            <div v-if="showLeaveCommunity" class="fixed inset-0 z-50 flex items-end 2xl:items-center justify-center">
                <div class="relative 2xl:max-w-[480px] w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl 2xl:rounded-3xl p-5 pb-6">
                    <button @click="showLeaveCommunity = false" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div class="w-full flex flex-col items-center gap-3">
                        <p class="text-center text-sm">¿Estás seguro de que querés salir de esta comunidad?</p>
                    </div>
                    <p v-if="leaveCommunityError" class="text-xs text-red-500 text-center">{{ leaveCommunityError }}</p>
                    <div class="w-full flex flex-col items-center gap-2">
                        <ButtonPrimary :disabled="isSaving" @click="confirmLeaveCommunity">Sí, salir</ButtonPrimary>
                        <ButtonTerciary @click="showLeaveCommunity = false">Cancelar</ButtonTerciary>
                    </div>
                </div>
            </div>
        </Transition>

        <Transition name="fade">
            <div v-if="showDeleteCommunity" class="fixed inset-0 z-40 bg-dark bg-opacity-50"
                @click="showDeleteCommunity = false"></div>
        </Transition>
        <Transition name="pop-up">
            <div v-if="showDeleteCommunity" class="fixed inset-0 z-50 flex items-end 2xl:items-center justify-center">
                <div class="relative 2xl:max-w-[480px] w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl 2xl:rounded-3xl p-5 pb-6">
                    <button @click="showDeleteCommunity = false" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div class="w-full flex flex-col items-center gap-3">
                        <div class="w-9 h-9 flex justify-center items-center bg-gradient-secondary rounded-full">
                            <NuxtImg src="/images/icons/delete-accent.svg" alt="Icono Borrar" class="w-3" />
                        </div>
                        <p class="text-center text-sm">¿Estás seguro de que querés eliminar esta comunidad de manera
                            permanente?
                        </p>
                    </div>
                    <p v-if="deleteCommunityError" class="text-xs text-red-500 text-center">{{ deleteCommunityError }}</p>
                    <div class="w-full flex flex-col items-center gap-2">
                        <ButtonPrimary :disabled="isSaving" @click="confirmDeleteCommunity">Sí, eliminar</ButtonPrimary>
                        <ButtonTerciary @click="showDeleteCommunity = false">Cancelar</ButtonTerciary>
                    </div>
                </div>
            </div>
        </Transition>
        </template>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const supabase = useSupabaseClient()
const {
    getCommunityById,
    getCommunityHabit,
    getCommunityHabitCompletions,
    updateCommunityName,
    deleteCommunity,
    removeMemberFromCommunity,
    addMembersToExistingCommunity,
} = useCommunities()
const { getFriends } = useFriends()

const community = ref(null)
const habit = ref(null)
const completions = ref([])
const friends = ref([])
const isSaving = ref(false)
const currentUserId = ref(null)
const isLoading = ref(true)

const isEditingName = ref(false)
const editedName = ref('')

const cancelEditName = () => {
    isEditingName.value = false
}

const saveName = async () => {
    const trimmed = editedName.value.trim()
    if (!trimmed || trimmed === community.value?.name) {
        isEditingName.value = false
        return
    }
    try {
        await updateCommunityName(route.params.id, trimmed)
        community.value = { ...community.value, name: trimmed }
    } catch (e) {
        console.error('Error actualizando nombre:', e)
    } finally {
        isEditingName.value = false
    }
}

const showEditMembers = ref(false)
const showAddMembers = ref(false)
const showDeleteCommunity = ref(false)
const showLeaveCommunity = ref(false)
const memberToRemove = ref(null)
const removeError = ref('')
const deleteCommunityError = ref('')
const leaveCommunityError = ref('')

const searchQuery = ref('')
const selectedToAdd = ref([])

const isAdmin = computed(() =>
    community.value?.members?.some(
        m => m.profile.id === currentUserId.value && m.role === 'admin'
    )
)

const editableMembers = computed(() =>
    (community.value?.members || []).filter(m => m.profile.id !== currentUserId.value)
)

const currentMemberIds = computed(() =>
    (community.value?.members || []).map(m => m.profile.id)
)

const filteredFriendsToAdd = computed(() => {
    const query = searchQuery.value.toLowerCase()
    if (!query) return friends.value
    return friends.value.filter(f => f.display_name?.toLowerCase().includes(query))
})

const loadData = async () => {
    try {
        const id = route.params.id
        const { data: { session } } = await supabase.auth.getSession()
        currentUserId.value = session?.user?.id ?? null

        const [communityData, habitData, friendsData] = await Promise.all([
            getCommunityById(id),
            getCommunityHabit(id),
            getFriends(),
        ])
        community.value = communityData
        editedName.value = communityData?.name ?? ''
        habit.value = habitData
        friends.value = friendsData || []

        if (habitData) {
            completions.value = await getCommunityHabitCompletions(habitData.id)
        }
    } finally {
        isLoading.value = false
    }
}

const openAddMembers = () => {
    searchQuery.value = ''
    selectedToAdd.value = []
    showAddMembers.value = true
}

const toggleAddMember = (id) => {
    if (currentMemberIds.value.includes(id)) return
    const idx = selectedToAdd.value.indexOf(id)
    if (idx === -1) {
        selectedToAdd.value.push(id)
    } else {
        selectedToAdd.value.splice(idx, 1)
    }
}

const saveNewMembers = async () => {
    if (selectedToAdd.value.length === 0 || isSaving.value) return
    isSaving.value = true
    try {
        await addMembersToExistingCommunity(route.params.id, selectedToAdd.value)
        await loadData()
        showAddMembers.value = false
    } catch (e) {
        console.error('Error agregando miembros:', e)
    } finally {
        isSaving.value = false
    }
}

const askRemoveMember = (member) => {
    memberToRemove.value = member
    removeError.value = ''
    showEditMembers.value = false
}

const confirmRemoveMember = async () => {
    if (!memberToRemove.value || isSaving.value) return
    isSaving.value = true
    removeError.value = ''
    try {
        await removeMemberFromCommunity(route.params.id, memberToRemove.value.profile.id)
        await loadData()
        memberToRemove.value = null
    } catch (e) {
        removeError.value = e.message || 'Error al eliminar el miembro.'
    } finally {
        isSaving.value = false
    }
}

const confirmLeaveCommunity = async () => {
    isSaving.value = true
    leaveCommunityError.value = ''
    try {
        await removeMemberFromCommunity(route.params.id, currentUserId.value)
        showLeaveCommunity.value = false
        await navigateTo('/comunidades')
    } catch (e) {
        leaveCommunityError.value = e.message || 'Error al salir de la comunidad.'
    } finally {
        isSaving.value = false
    }
}

const confirmDeleteCommunity = async () => {
    isSaving.value = true
    deleteCommunityError.value = ''
    try {
        await deleteCommunity(route.params.id)
        showDeleteCommunity.value = false
        await navigateTo('/comunidades')
    } catch (e) {
        deleteCommunityError.value = e.message || 'Error al eliminar la comunidad.'
    } finally {
        isSaving.value = false
    }
}

onMounted(loadData)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.pop-up-enter-active,
.pop-up-leave-active {
    transition: transform 0.3s ease;
}

.pop-up-enter-from,
.pop-up-leave-to {
    transform: translateY(100%);
}

@media (min-width: 992px) {
    .pop-up-enter-active,
    .pop-up-leave-active {
        transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .pop-up-enter-from,
    .pop-up-leave-to {
        opacity: 0;
        transform: scale(0.9);
    }
}
</style>
