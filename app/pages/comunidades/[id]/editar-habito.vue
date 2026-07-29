<template>
    <DefaultSection class="pb-12">
        <div class="w-full flex items-center">
            <NavigationBackArrow class="absolute text-gray" :url="`/comunidades/${route.params.id}/habito`" />
            <h1 class="w-full text-sm font-bold text-center">{{ habit?.icon }} {{ habit?.name }}</h1>
            <div class="w-6"></div>
        </div>

        <div v-if="isLoading" class="w-full flex justify-center py-10">
            <Loader color="primary" />
        </div>
        <template v-else-if="habit">
            <CommunityHabitForm
                :initialData="habit"
                :isEditing="true"
                :isLoading="isSaving"
                @submit="handleSubmit"
            />
            <FormError v-if="saveError">{{ saveError }}</FormError>
        </template>
    </DefaultSection>
</template>

<script setup>

useSeoTags({
    title: 'Editar hábito comunitario',
    description: 'Actualizá el hábito compartido de la comunidad que administrás.',
})
const route = useRoute()
const { getCommunityHabit, updateCommunityHabit, isCommunityAdmin } = useCommunities()

const habit = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const saveError = ref('')

const handleSubmit = async (habitPayload) => {
    if (isSaving.value) return
    isSaving.value = true
    saveError.value = ''
    try {
        await updateCommunityHabit(habit.value.id, habitPayload)
        await navigateTo(`/comunidades/${route.params.id}/habito`)
    } catch (e) {
        saveError.value = handleSupabaseError(e)
    } finally {
        isSaving.value = false
    }
}

onMounted(async () => {
    const communityId = route.params.id
    try {
        const [admin, habitData] = await Promise.all([
            isCommunityAdmin(communityId),
            getCommunityHabit(communityId),
        ])

        if (!admin || !habitData) {
            await navigateTo(`/comunidades/${communityId}/habito`)
            return
        }

        habit.value = habitData
    } catch (e) {
        console.error('Error cargando hábito de comunidad:', e)
        await navigateTo(`/comunidades/${communityId}`)
    } finally {
        isLoading.value = false
    }
})
</script>
