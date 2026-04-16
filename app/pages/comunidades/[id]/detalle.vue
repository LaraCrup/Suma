<template>
    <DefaultSection>
        <!-- Header con back arrow -->
        <div class="w-full">
            <NavigationBackArrow color="text-gray" />
        </div>

        <!-- Info de la comunidad + edición de nombre -->
        <div class="w-full flex items-center gap-4">
            <div class="w-12 h-12 flex items-center justify-center bg-green-dark rounded-full flex-shrink-0">
                <p class="text-3xl">{{ community?.icon }}</p>
            </div>
            <div class="w-full flex flex-col gap-1 border-b border-gray pb-1">
                <p class="text-xs text-dark">Nombre de la comunidad</p>
                <div class="flex items-center gap-2">
                    <NuxtImg v-if="isAdmin" src="/images/icons/edit.svg" alt="Editar nombre" class="w-4 flex-shrink-0" />
                    <input
                        v-model="editedName"
                        :readonly="!isAdmin"
                        @focus="isEditingName = true"
                        @blur="saveName"
                        @keyup.enter="$event.target.blur()"
                        @keyup.escape="cancelEditName"
                        class="text-sm font-semibold bg-transparent focus:outline-none w-full transition-colors"
                        :class="isEditingName ? 'text-dark' : 'text-gray'"
                    />
                </div>
            </div>
        </div>

        <!-- Hábito compartido -->
        <div v-if="habit" class="w-full">
            <HabitsCommunityCard :habit="habit" :members="completions" />
        </div>

        <!-- Sección de miembros -->
        <div class="w-full flex flex-col gap-2">
            <div class="flex justify-between items-center">
                <p class="text-sm text-dark">Miembros: {{ community?.member_count }}</p>
                <button v-if="isAdmin" @click="showEditMembers = true" class="w-6 h-6 flex items-center justify-center">
                    <NuxtImg src="/images/icons/edit.svg" alt="Editar miembros" class="w-4" />
                </button>
            </div>
            <div class="w-full flex flex-col gap-2">
                <CommunityFriendsCard v-for="member in community?.members" :key="member.profile.id"
                    :friend="member.profile" />
            </div>
        </div>

        <!-- Eliminar comunidad (solo admin) -->
        <button v-if="isAdmin" @click="showDeleteCommunity = true"
            class="flex items-center gap-2 text-sm text-red-500 mt-2">
            <NuxtImg src="/images/icons/delete.svg" alt="Eliminar" class="w-4" />
            Eliminar comunidad
        </button>

        <!-- ===================== MODALS ===================== -->

        <!-- 1. Editar miembros -->
        <Transition name="fade">
            <div v-if="showEditMembers" class="fixed inset-0 z-40 bg-dark bg-opacity-50"
                @click="showEditMembers = false"></div>
        </Transition>
        <Transition name="slide-up">
            <div v-if="showEditMembers" class="fixed inset-0 z-50 flex items-end">
                <div
                    class="relative w-full flex flex-col gap-4 bg-light rounded-t-3xl p-5 pb-6 max-h-[80vh] overflow-y-auto">
                    <button @click="showEditMembers = false" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <p class="text-sm font-medium text-dark">Agregá o eliminá miembros</p>

                    <!-- Botón agregar -->
                    <button @click="openAddMembers"
                        class="flex items-center gap-2 bg-primary text-light text-xs rounded-full px-4 py-2 w-fit">
                        <span class="text-base leading-none">+</span>
                        Agregar miembros
                    </button>

                    <!-- Lista de miembros con papelera -->
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
                                <p class="text-xs text-dark">{{ member.profile.display_name }}</p>
                            </div>
                            <button @click="askRemoveMember(member)" class="w-6 h-6 flex items-center justify-center">
                                <NuxtImg src="/images/icons/delete.svg" alt="Eliminar miembro" class="w-4" />
                            </button>
                        </div>
                    </div>

                    <ButtonPrimary @click="showEditMembers = false">Guardar</ButtonPrimary>
                </div>
            </div>
        </Transition>

        <!-- 2. Agregar miembros (búsqueda) -->
        <Transition name="fade">
            <div v-if="showAddMembers" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="showAddMembers = false">
            </div>
        </Transition>
        <Transition name="slide-up">
            <div v-if="showAddMembers" class="fixed inset-0 z-50 flex items-end">
                <div
                    class="relative w-full flex flex-col gap-4 bg-light rounded-t-3xl p-5 pb-6 max-h-[80vh] overflow-y-auto">
                    <button @click="showAddMembers = false" class="absolute top-4 right-4 text-gray">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <p class="text-sm font-medium text-dark">Agregá miembros</p>

                    <!-- Search -->
                    <div class="relative w-full">
                        <NuxtImg src="/images/icons/search.svg" alt="Buscar"
                            class="w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input v-model="searchQuery" type="text" placeholder="Escribí acá..."
                            class="w-full h-10 bg-midlight text-xs text-dark focus:outline-none rounded-lg border-[1px] border-solid border-gray pl-9 pr-3" />
                    </div>

                    <!-- Lista de amigos (excluye miembros actuales) -->
                    <div class="flex flex-col gap-2">
                        <CommunityFriendsCard v-for="friend in filteredFriendsToAdd" :key="friend.id" :friend="friend"
                            :selectable="true" :selected="selectedToAdd.includes(friend.id)"
                            @toggle="toggleAddMember" />
                        <p v-if="filteredFriendsToAdd.length === 0" class="text-xs text-gray text-center py-2">
                            No hay amigos para agregar.
                        </p>
                    </div>

                    <ButtonPrimary :disabled="selectedToAdd.length === 0 || isSaving" @click="saveNewMembers">Guardar
                    </ButtonPrimary>
                </div>
            </div>
        </Transition>

        <!-- 3. Confirmar eliminar miembro -->
        <div v-if="memberToRemove" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="memberToRemove = null">
        </div>
        <div v-if="memberToRemove" class="fixed inset-0 z-50 flex items-end">
            <div class="relative w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl p-5 pb-6">
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
                        ¿Estás seguro que querés eliminar a
                        <strong>{{ memberToRemove?.profile?.display_name }}</strong>
                        de esta comunidad?
                    </p>
                </div>
                <div class="w-full flex flex-col items-center gap-2">
                    <ButtonPrimary :disabled="isSaving" @click="confirmRemoveMember">Sí, eliminar</ButtonPrimary>
                    <ButtonTerciary @click="memberToRemove = null">Cancelar</ButtonTerciary>
                </div>
            </div>
        </div>

        <!-- 4. Confirmar eliminar comunidad -->
        <Transition name="fade">
            <div v-if="showDeleteCommunity" class="fixed inset-0 z-40 bg-dark bg-opacity-50"
                @click="showDeleteCommunity = false"></div>
        </Transition>
        <Transition name="slide-up">
            <div v-if="showDeleteCommunity" class="fixed inset-0 z-50 flex items-end">
                <div class="relative w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl p-5 pb-6">
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
                        <p class="text-center text-sm">¿Estás seguro que querés eliminar esta comunidad de manera
                            permanente?
                        </p>
                    </div>
                    <div class="w-full flex flex-col items-center gap-2">
                        <ButtonPrimary :disabled="isSaving" @click="confirmDeleteCommunity">Sí, eliminar</ButtonPrimary>
                        <ButtonTerciary @click="showDeleteCommunity = false">Cancelar</ButtonTerciary>
                    </div>
                </div>
            </div>
        </Transition>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const authStore = useAuthStore()
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

// Edición de nombre
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

// Modals
const showEditMembers = ref(false)
const showAddMembers = ref(false)
const showDeleteCommunity = ref(false)
const memberToRemove = ref(null)

// Add members state
const searchQuery = ref('')
const selectedToAdd = ref([])

const currentUserId = computed(() => authStore.user?.id)

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
    return friends.value.filter(f =>
        !currentMemberIds.value.includes(f.id) &&
        (!query || f.display_name?.toLowerCase().includes(query))
    )
})

const loadData = async () => {
    const id = route.params.id
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
}

const openAddMembers = () => {
    searchQuery.value = ''
    selectedToAdd.value = []
    showAddMembers.value = true
}

const toggleAddMember = (id) => {
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
    showEditMembers.value = false
}

const confirmRemoveMember = async () => {
    if (!memberToRemove.value || isSaving.value) return
    isSaving.value = true
    try {
        await removeMemberFromCommunity(route.params.id, memberToRemove.value.profile.id)
        await loadData()
        memberToRemove.value = null
    } catch (e) {
        console.error('Error eliminando miembro:', e)
    } finally {
        isSaving.value = false
    }
}

const confirmDeleteCommunity = async () => {
    isSaving.value = true
    try {
        await deleteCommunity(route.params.id)
        showDeleteCommunity.value = false
        await navigateTo('/comunidades')
    } catch (e) {
        console.error('Error eliminando comunidad:', e)
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

.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100%);
}
</style>
