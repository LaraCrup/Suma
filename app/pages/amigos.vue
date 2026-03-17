<template>
    <DefaultSection>
        <div class="w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit text-gray" />
            <HeadingH1>Agregar Amigos</HeadingH1>
        </div>
        <form class="w-full flex flex-col gap-2" @submit.prevent>
            <FormLabel id="searchFriends" class="sr-only">Buscá por nombre de usuario</FormLabel>

            <div class="relative w-full">
                <input
                    ref="inputElement"
                    id="searchFriends"
                    v-model="query"
                    type="text"
                    placeholder="Buscá por nombre de usuario"
                    class="w-full bg-light border border-primary rounded-full outline-none text-dark text-xs placeholder:text-gray placeholder:text-xs py-3 px-5 pl-9"
                />
                <NuxtImg src="/images/icons/search.svg" class="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3" />
            </div>
        </form>
        <div v-if="results.length > 0" class="w-full flex flex-col gap-2">
            <CommunityFriendsCardAdd
                v-for="user in results"
                :key="user.id"
                :user="user"
                :isPending="pendingIds.includes(user.id)"
                @request-sent="onRequestSent"
                @request-cancelled="onRequestCancelled"
            />
        </div>
        <p v-else-if="query.length > 0 && !loading" class="text-[0.625rem] text-gray text-center">
            No se encontraron usuarios.
        </p>
    </DefaultSection>
</template>

<script setup>
const { searchUsers, getSentPendingIds } = useFriends()

const inputElement = ref(null)
const query = ref('')
const results = ref([])
const pendingIds = ref([])
const loading = ref(false)

let debounceTimer = null

watch(query, (val) => {
    clearTimeout(debounceTimer)
    if (!val.trim()) {
        results.value = []
        return
    }
    debounceTimer = setTimeout(async () => {
        loading.value = true
        results.value = await searchUsers(val)
        loading.value = false
    }, 300)
})

const onRequestSent = (userId) => {
    pendingIds.value.push(userId)
}

const onRequestCancelled = (userId) => {
    pendingIds.value = pendingIds.value.filter(id => id !== userId)
}

onMounted(async () => {
    pendingIds.value = await getSentPendingIds()
    nextTick(() => inputElement.value?.focus())
})
</script>
