<template>
    <DefaultSection>
        <NavigationBackArrow class="text-gray" />

        <div v-if="loading" class="w-full flex justify-center py-8">
            <Loader />
        </div>

        <template v-else-if="item">
            <div class="relative w-full h-32 rounded-lg overflow-hidden flex items-end p-3">
                <NuxtImg
                    v-if="item.image_url"
                    :src="item.image_url"
                    :alt="item.title"
                    class="absolute inset-0 w-full h-full object-cover"
                />
                <span class="relative z-10 text-xs bg-accent text-green-dark px-2 py-1 rounded-full">
                    {{ item.category?.name }}
                </span>
            </div>

            <div class="w-full flex flex-col gap-3 px-3">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <NuxtImg
                            v-if="item.brand?.image_url"
                            :src="item.brand.image_url"
                            :alt="item.brand?.name"
                            class="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        />
                        <span class="text-xs text-dark">Por {{ item.brand?.name }}</span>
                    </div>
                    <span class="text-xs text-gray">{{ formatDate(item.publication_date) }}</span>
                </div>
                <div class="w-full flex flex-col gap-2">
                    <HeadingH1 class="!text-base !leading-tight">{{ item.title }}</HeadingH1>
    
                    <p class="text-xs text-dark whitespace-pre-line">{{ item.content }}</p>
                </div>

            </div>
        </template>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()
const { getNews } = useNovedades()

const item = ref(null)
const loading = ref(true)

const formatDate = (date) => {
    if (!date) return ''
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${String(year).slice(-2)}`
}

onMounted(async () => {
    const all = await getNews()
    item.value = all.find(n => n.id === route.params.id) ?? null
    loading.value = false
})
</script>
