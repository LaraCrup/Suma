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
            <div class="flex gap-3 items-center">
                <NuxtImg
                    class="w-6 h-6 rounded-full object-cover"
                    :src="benefit.brand_image || '/images/placeholder.png'"
                    :alt="benefit.brand_name"
                />
                <p class="text-xs">{{ benefit.title }}</p>
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
