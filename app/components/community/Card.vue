<template>
    <NuxtLink
        :to="`/comunidades/${community.id}`"
        class="w-full flex justify-between gap-2 rounded-lg p-3 bg-midlight">
        <div class="flex gap-3 items-center min-w-0 flex-1">
            <div class="w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-secondary">
                <p class="text-sm leading-3">{{ community.icon }}</p>
            </div>
            <div class="min-w-0">
                <p class="text-sm text-start truncate">{{ community.name }}</p>
                <p class="text-xs text-green-dark font-normal">
                    {{ community.member_count }} participante{{ community.member_count === 1 ? '' : 's' }}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
            <div class="flex flex-shrink-0 items-center gap-1">
                <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                <p class="text-xs">{{ community.streak ?? 0 }}</p>
            </div>
            <div class="w-6 h-6 flex flex-shrink-0 justify-center items-center rounded-full border-gray border-[1px]">
                <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-3" />
            </div>
        </div>
    </NuxtLink>
</template>

<script setup>
defineProps({
    community: {
        type: Object,
        required: true
    }
})
</script>
