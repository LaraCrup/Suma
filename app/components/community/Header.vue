<template>
    <div class="w-full flex items-center gap-3">
        <NavigationBackArrow class="!w-fit" color="text-gray" />
        <NuxtLink :to="`/comunidades/${community?.id}/detalle`" class="w-full flex items-center gap-3">
            <div class="w-8 2xl:w-10 h-8 2xl:h-10 flex flex-shrink-0 items-center justify-center bg-green-dark rounded-full overflow-hidden">
                <p class="text-lg 2xl:text-xl">{{ community?.icon }}</p>
            </div>
            <div class="h-full flex flex-col justify-between">
                <h1 class="text-sm 2xl:text-base text-dark">{{ community?.name }}</h1>
                <p class="text-xs 2xl:text-sm text-green-dark">
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
