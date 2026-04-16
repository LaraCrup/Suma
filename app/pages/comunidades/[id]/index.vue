<template>
    <DefaultSection>
        <div class="w-full flex flex-col gap-3">
            <CommunityHeader :community="community" />
            <div v-if="habit" class="w-full">
                <HabitsCommunityCard :habit="habit" :members="completions" />
            </div>
        </div>
        <div ref="messagesContainer" class="relative w-full h-[50dvh] flex flex-col justify-end gap-2 overflow-y-auto">
            <template v-for="msg in messages" :key="msg.id">
                <CommunityChatOutputMessage v-if="msg.user_id === currentUserId" :message="msg" />
                <CommunityChatInputMessage v-else :message="msg" />
            </template>
            <p v-if="messages.length === 0" class="text-[0.625rem] text-gray text-center pb-2">
                No hay mensajes aún. ¡Escribí el primero!
            </p>
            <div class="absolute top-0 left-0 h-[50dvh] w-full bg-[linear-gradient(180deg,_rgba(243,252,247,1)_0%,rgba(243,252,247,0)_12%)] pointer-events-none"></div>
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
                <NuxtImg src="/images/icons/send.svg" alt="Enviar" class="w-3 h-3" />
            </button>
        </form>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const { getCommunityById, getCommunityHabit, getCommunityMessages, sendMessage, getCommunityHabitCompletions } = useCommunities()

const community = ref(null)
const habit = ref(null)
const completions = ref([])
const messages = ref([])
const newMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref(null)
const currentUserId = ref(null)

const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

const loadCommunity = async () => {
    const id = route.params.id
    const { data: { session } } = await useSupabaseClient().auth.getSession()
    currentUserId.value = session?.user?.id ?? null

    const [communityData, habitData, messagesData] = await Promise.all([
        getCommunityById(id),
        getCommunityHabit(id),
        getCommunityMessages(id),
    ])
    community.value = communityData
    habit.value = habitData
    messages.value = messagesData
    if (habitData) {
        completions.value = await getCommunityHabitCompletions(habitData.id)
    }
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
