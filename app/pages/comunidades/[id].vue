<template>
    <DefaultSection>
        <div class="w-full flex flex-col gap-3">
            <div class="w-full flex items-center gap-3">
                <NavigationBackArrow class="!w-fit" color="text-gray" />
                <div class="w-full flex items-center gap-3">
                    <div class="w-8 h-8 flex items-center justify-center bg-green-dark rounded-full overflow-hidden">
                        <p class="text-lg">{{ community?.icon }}</p>
                    </div>
                    <div class="h-full flex flex-col justify-between">
                        <h1 class="text-sm text-dark">{{ community?.name }}</h1>
                        <p class="text-[0.625rem] text-green-dark">
                            {{ community?.member_count }} participante{{ community?.member_count === 1 ? '' : 's' }}
                        </p>
                    </div>
                </div>
            </div>
            <div v-if="habit" class="w-full">
                <HabitsCommunityCard :habit="habit" />
            </div>
        </div>
        <div ref="messagesContainer" class="relative w-full h-[60vh] flex flex-col justify-end gap-2 overflow-y-auto">
            <template v-for="msg in messages" :key="msg.id">
                <CommunityChatOutputMessage v-if="msg.sender?.id === currentUserId" :message="msg" />
                <CommunityChatInputMessage v-else :message="msg" />
            </template>
            <p v-if="messages.length === 0" class="text-[0.625rem] text-gray text-center pb-2">
                No hay mensajes aún. ¡Escribí el primero!
            </p>
            <div class="absolute top-0 left-0 h-[60vh] w-full bg-[linear-gradient(180deg,_rgba(243,252,247,1)_0%,rgba(243,252,247,0)_12%)] pointer-events-none"></div>
        </div>
        <form @submit.prevent="handleSend" class="relative w-full">
            <input
                v-model="newMessage"
                type="text"
                placeholder="Escribí acá..."
                class="w-full h-11 bg-midlight text-sm text-dark focus:outline-none rounded-lg border-[1px] border-solid border-gray px-3 py-2 pr-12"
            />
            <button
                type="submit"
                :disabled="isSending || !newMessage.trim()"
                class="w-7 h-7 absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-primary rounded-full disabled:opacity-50"
            >
                <img src="/images/icons/send.svg" alt="Enviar" class="w-3 h-3">
            </button>
        </form>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const authStore = useAuthStore()
const { getCommunityById, getCommunityHabit, getCommunityMessages, sendMessage } = useCommunities()

const community = ref(null)
const habit = ref(null)
const messages = ref([])
const newMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref(null)

const currentUserId = computed(() => authStore.user?.id)

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

const loadCommunity = async () => {
    const id = route.params.id
    const [communityData, habitData, messagesData] = await Promise.all([
        getCommunityById(id),
        getCommunityHabit(id),
        getCommunityMessages(id),
    ])
    community.value = communityData
    habit.value = habitData
    messages.value = messagesData
    scrollToBottom()
}

const handleSend = async () => {
    if (!newMessage.value.trim() || isSending.value) return
    isSending.value = true
    try {
        const msg = await sendMessage(route.params.id, newMessage.value)
        messages.value.push(msg)
        newMessage.value = ''
        scrollToBottom()
    } catch (e) {
        console.error('Error enviando mensaje:', e)
    } finally {
        isSending.value = false
    }
}

onMounted(loadCommunity)
</script>
