<template>
    <div class="w-full flex items-center gap-3">
        <NavigationBackArrow class="!w-fit" color="text-gray" />
        <NuxtLink :to="`/comunidades/${community?.id}/detalle`" class="w-full flex items-center gap-3">
            <div class="w-8 h-8 flex items-center justify-center bg-green-dark rounded-full overflow-hidden">
                <p class="text-lg">{{ community?.icon }}</p>
            </div>
            <div class="h-full flex flex-col justify-between">
                <h1 class="text-sm text-dark">{{ community?.name }}</h1>
                <p class="text-[0.625rem] text-green-dark">
                    {{ community?.member_count }} participante{{ community?.member_count === 1 ? '' : 's' }}
                </p>
            </div>
        </NuxtLink>
    </div>
</template>

<script setup>
defineProps({
    community: {
        type: Object,
        default: null
    }
})
</script>
