<template>
    <DefaultSection class="!gap-3">
        <div class="w-full flex justify-between items-center">
            <HeadingH1>Mis Comunidades</HeadingH1>
            <button
                @click="navigateTo('/comunidades/crear')"
                class="w-6 h-6 flex items-center justify-center bg-accent text-green-dark font-bold rounded-full"
            >+</button>
        </div>
        <div class="w-full flex flex-col gap-2">
            <CommunityCard
                v-for="c in communities"
                :key="c.id"
                :community="c"
            />
            <p v-if="communities.length === 0" class="text-[0.625rem] text-gray">
                Aún no pertenecés a ninguna comunidad. ¡Creá una con el +!
            </p>
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-3">
        <div class="w-full flex justify-between items-center">
            <HeadingH1>Mis amigos</HeadingH1>
            <button
                @click="navigateTo('/amigos')"
                class="w-6 h-6 flex items-center justify-center bg-accent text-green-dark font-bold rounded-full"
            >+</button>
        </div>
        <div v-if="pendingRequests.length > 0" class="w-full flex flex-col gap-2">
            <p class="text-[0.625rem] text-dark font-bold">Pendientes</p>
            <CommunityFriendsRequest
                v-for="req in pendingRequests"
                :key="req.id"
                :request="req"
                @accepted="onRequestHandled(req.id)"
                @declined="onRequestHandled(req.id)"
            />
        </div>
        <div class="w-full flex flex-col gap-2">
            <CommunityFriendsCard
                v-for="friend in friends"
                :key="friend.id"
                :friend="friend"
            />
            <p v-if="friends.length === 0 && pendingRequests.length === 0" class="text-[0.625rem] text-gray">
                Aún no tenés amigos. ¡Buscá usuarios con el +!
            </p>
        </div>
    </DefaultSection>
</template>

<script setup>
const { getPendingRequests, getFriends } = useFriends()
const { getCommunities } = useCommunities()

const pendingRequests = ref([])
const friends = ref([])
const communities = ref([])

const loadData = async () => {
    const [requests, friendsList, communitiesList] = await Promise.all([
        getPendingRequests(),
        getFriends(),
        getCommunities()
    ])
    pendingRequests.value = requests
    friends.value = friendsList
    communities.value = communitiesList
}

const onRequestHandled = (requestId) => {
    pendingRequests.value = pendingRequests.value.filter(r => r.id !== requestId)
    loadData()
}

onMounted(loadData)
</script>
