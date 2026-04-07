<template>
    <DefaultSection>
        <div class="w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit" color="text-gray" />
            <HeadingH1>Armá tu comunidad</HeadingH1>
        </div>

        <!-- Step indicator -->
        <div class="w-full flex flex-col gap-1">
            <div class="w-full h-2 bg-green-dark rounded-full overflow-hidden">
                <div class="h-full bg-gradient-secondary rounded-full" style="width: 5%" />
            </div>
            <div class="w-full flex justify-between items-center">
                <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                </div>
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                </div>
            </div>
        </div>

        <!-- Search -->
        <div class="relative w-full">
            <input
                v-model="query"
                type="text"
                placeholder="Escribí acá..."
                class="w-full bg-midlight border border-gray rounded-lg outline-none text-dark text-xs placeholder:text-gray placeholder:text-xs py-3 pr-3 pl-9"
            />
            <NuxtImg src="/images/icons/search.svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3" />
        </div>

        <!-- Friends list -->
        <div class="w-full flex flex-col gap-2">
            <CommunityFriendsCard
                v-for="friend in filteredFriends"
                :key="friend.id"
                :friend="friend"
                :selectable="true"
                :selected="selectedIds.includes(friend.id)"
                @toggle="toggleFriend"
            />
            <p v-if="friends.length === 0" class="text-[0.625rem] text-gray text-center">
                Aún no tenés amigos para agregar.
            </p>
        </div>

        <FormError v-if="showError">Tenés que seleccionar al menos un amigo para continuar.</FormError>
        <ButtonPrimary @click="siguiente">Siguiente</ButtonPrimary>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const { getFriends } = useFriends()

const friends = ref([])
const query = ref('')
const selectedIds = ref([])
const showError = ref(false)

const filteredFriends = computed(() => {
    if (!query.value.trim()) return friends.value
    return friends.value.filter(f =>
        f.display_name?.toLowerCase().includes(query.value.toLowerCase())
    )
})

const toggleFriend = (id) => {
    if (selectedIds.value.includes(id)) {
        selectedIds.value = selectedIds.value.filter(i => i !== id)
    } else {
        selectedIds.value.push(id)
    }
}

const siguiente = () => {
    if (selectedIds.value.length === 0) {
        showError.value = true
        return
    }
    showError.value = false
    navigateTo({ path: '/comunidades/crear/paso2', query: { members: selectedIds.value.join(',') } })
}

onMounted(async () => {
    friends.value = await getFriends()
    const preselected = route.query.members?.split(',').filter(Boolean) ?? []
    selectedIds.value = preselected
})
</script>
