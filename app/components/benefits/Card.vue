<template>
    <NuxtLink :to="`/progreso/beneficios/${benefit.id}`" class="block">
        <div>
            <NuxtImg
                class="w-full h-32 rounded-t-lg object-cover"
                :src="benefit.image || '/images/placeholder.png'"
                :alt="benefit.title"
            />
        </div>
        <div class="w-full flex items-center justify-between gap-3 bg-midlight rounded-b-lg p-3">
            <div class="flex gap-3 items-center 2xl:min-h-[2.5rem]">
                <NuxtImg
                    class="w-6 2xl:w-8 h-6 2xl:h-8 rounded-full object-cover"
                    :src="benefit.brand_image || '/images/placeholder.png'"
                    :alt="benefit.brand_name"
                />
                <p class="text-xs 2xl:text-sm 2xl:line-clamp-2">{{ benefit.title }}</p>
            </div>
            <div class="w-6 h-6 flex justify-center items-center rounded-full border-gray border-[1px] flex-shrink-0">
                <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-3" />
            </div>
        </div>
    </NuxtLink>
</template>

<script setup>
defineProps({
    benefit: {
        type: Object,
        required: true
    }
})
</script>
