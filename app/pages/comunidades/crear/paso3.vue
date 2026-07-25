<template>
    <DefaultSection>
        <div class="w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit" color="text-gray" :url="{ path: '/comunidades/crear/paso2', query: { members: route.query.members, name: route.query.name, icon: route.query.icon } }" />
            <HeadingH1>Nueva comunidad</HeadingH1>
        </div>

        <div class="w-full flex flex-col gap-1">
            <div class="w-full h-2 bg-green-dark rounded-full overflow-hidden">
                <div class="h-full bg-gradient-secondary rounded-full" style="width: 95%" />
            </div>
            <div class="w-full flex justify-between items-center">
                <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                </div>
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                </div>
            </div>
        </div>

        <CommunityHabitForm :isLoading="isLoading" @submit="handleSubmit" />
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const { createCommunity } = useCommunities()

const isLoading = ref(false)

const handleSubmit = async (habitPayload) => {
    isLoading.value = true
    try {
        const memberIds = route.query.members?.split(',').filter(Boolean) ?? []

        await createCommunity(
            route.query.name,
            route.query.icon,
            memberIds,
            habitPayload
        )

        navigateTo('/comunidades')
    } catch (e) {
        console.error('Error creando comunidad:', e)
    } finally {
        isLoading.value = false
    }
}
</script>
