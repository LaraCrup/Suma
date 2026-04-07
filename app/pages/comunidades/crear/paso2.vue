<template>
    <DefaultSection>
        <div class="w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit" color="text-gray" />
            <HeadingH1>Nueva comunidad</HeadingH1>
        </div>

        <!-- Step indicator (paso 2) -->
        <div class="w-full flex flex-col gap-1">
            <div class="w-full h-2 bg-green-dark rounded-full overflow-hidden">
                <div class="h-full bg-gradient-secondary rounded-full" style="width: 50%" />
            </div>
            <div class="w-full flex justify-between items-center">
                <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                </div>
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                </div>
            </div>
        </div>

        <!-- Nombre -->
        <FormTextFieldSecondary id="community-name" v-model="name" label="Nombre de la comunidad"
            placeholder="Nombre de la comunidad" :error="errors.name" />

        <!-- Icono -->
        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex justify-between items-center">
                <FormLabelSecondary for="community-icon">Icono</FormLabelSecondary>
                <div class="flex items-center gap-2">
                    <input id="community-icon" v-model="icon" type="text"
                        class="w-12 h-12 text-xl text-center bg-transparent outline-none border border-gray rounded-full p-2"
                        placeholder="" maxlength="10" inputmode="text"
                        @input="filterEmojiIcon" />
                </div>
            </div>
            <FormError v-if="errors.icon">{{ errors.icon }}</FormError>
        </div>

        <!-- Miembros -->
        <div class="w-full flex flex-col gap-3">
            <p class="text-xs font-medium text-dark">Miembros: {{ members.length + 1 }}</p>
            <div class="flex flex-wrap gap-4">
                <!-- Agregar -->
                <NuxtLink :to="{ path: '/comunidades/crear', query: { members: members.map(m => m.id).join(',') } }" class="flex flex-col items-center gap-1">
                    <div class="w-10 h-10 rounded-full bg-green-dark flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                            viewBox="0 0 24 24">
                            <path class="fill-light"
                                d="M18 11h-2q-.425 0-.712-.288T15 10t.288-.712T16 9h2V7q0-.425.288-.712T19 6t.713.288T20 7v2h2q.425 0 .713.288T23 10t-.288.713T22 11h-2v2q0 .425-.288.713T19 14t-.712-.288T18 13zm-9 1q-1.65 0-2.825-1.175T5 8t1.175-2.825T9 4t2.825 1.175T13 8t-1.175 2.825T9 12m-8 6v-.8q0-.85.438-1.562T2.6 14.55q1.55-.775 3.15-1.162T9 13t3.25.388t3.15 1.162q.725.375 1.163 1.088T17 17.2v.8q0 .825-.587 1.413T15 20H3q-.825 0-1.412-.587T1 18" />
                        </svg>
                    </div>
                    <p class="text-[0.625rem] text-dark">Agregar</p>
                </NuxtLink>

                <!-- Current user -->
                <div class="flex flex-col items-center gap-1">
                    <Avatar
                        :name="currentProfile?.display_name"
                        :initial="currentProfile?.display_name?.charAt(0).toUpperCase()"
                        :image="currentProfile?.avatar_url"
                        sizeClass="w-10 h-10"
                    />
                    <p class="text-[0.625rem] text-dark">Vos</p>
                </div>

                <!-- Selected members -->
                <CommunityFriendsMember v-for="member in members" :key="member.id" :member="member"
                    @remove="removeMember" />
            </div>
        </div>

        <FormError v-if="errors.members">{{ errors.members }}</FormError>
        <ButtonPrimary @click="siguiente">Siguiente</ButtonPrimary>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const { getProfileById } = useFriends()
const authStore = useAuthStore()

const name = ref('')
const icon = ref('')
const members = ref([])
const currentProfile = computed(() => authStore.profile)
const errors = ref({ name: null, icon: null, members: null })

const filterEmojiIcon = () => {
    icon.value = [...icon.value]
        .filter(char => /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(char))
        .join('')
}

const removeMember = (id) => {
    if (members.value.length <= 1) {
        errors.value.members = 'Debe haber al menos dos miembros para crear una comunidad.'
        return
    }
    errors.value.members = null
    members.value = members.value.filter(m => m.id !== id)
}

const siguiente = () => {
    errors.value.name = null
    errors.value.icon = null

    if (!name.value.trim()) {
        errors.value.name = 'El nombre de la comunidad es obligatorio.'
    }
    if (!icon.value.trim()) {
        errors.value.icon = 'El icono de la comunidad es obligatorio.'
    }
    if (errors.value.name || errors.value.icon) return

    const currentMembers = members.value.map(m => m.id).join(',')
    router.replace({ query: { members: currentMembers } })
    navigateTo({ path: '/comunidades/crear/paso3', query: { members: currentMembers, name: name.value, icon: icon.value } })
}

onMounted(async () => {
    if (route.query.name) name.value = route.query.name
    if (route.query.icon) icon.value = route.query.icon
    const memberIds = route.query.members?.split(',').filter(Boolean) ?? []
    members.value = await Promise.all(memberIds.map(id => getProfileById(id)))
})
</script>
