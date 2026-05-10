<template>
    <DefaultSection>
        <div class="w-full flex flex-col gap-3">
            <HeadingH1 class="w-full">Novedades</HeadingH1>
    
            <div class="w-full flex gap-1 overflow-x-auto" style="-ms-overflow-style:none;scrollbar-width:none">
                <button
                    v-for="cat in categories"
                    :key="cat.id"
                    @click="selectCategory(cat.id)"
                    :class="[
                        'flex-shrink-0 text-xs px-3 py-2 rounded-lg border border-green-light transition-colors',
                        activeCategory === cat.id
                            ? 'bg-green-light text-light'
                            : 'bg-light text-dark'
                    ]"
                >
                    {{ cat.name }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="w-full flex flex-col gap-3">
            <SkeletonNewsCard v-for="i in 3" :key="i" />
        </div>

        <div v-else class="w-full flex flex-col gap-3">
            <NuxtLink
                v-for="item in news"
                :key="item.id"
                :to="`/novedades/${item.id}`"
                class="block w-full rounded-lg overflow-hidden"
            >
                <div class="relative h-28 bg-midlight flex items-end p-3">
                    <NuxtImg
                        v-if="item.image_url"
                        :src="item.image_url"
                        :alt="item.title"
                        class="absolute inset-0 w-full h-28 object-cover rounded-lg"
                    />
                    <span class="relative z-10 text-[0.625rem] bg-accent text-green-dark px-2 py-1 rounded-full">
                        {{ item.category?.name }}
                    </span>
                </div>

                <div class="bg-midlight p-3 flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-1.5">
                            <NuxtImg
                                :src="item.brand.image_url"
                                :alt="item.brand?.name"
                                class="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                            <span class="text-[0.625rem] text-dark">Por {{ item.brand?.name }}</span>
                        </div>
                        <span class="text-[0.625rem] text-gray">{{ formatDate(item.publication_date) }}</span>
                    </div>
                    <div class="w-full flex flex-col gap-2">
                        <p class="text-xs font-bold text-dark leading-tight">{{ item.title }}</p>
    
                        <p class="text-[0.625rem] text-dark line-clamp-3">{{ item.content }}</p>
                    </div>
                    <div class="flex justify-end">
                        <span class="bg-green-light text-[0.625rem] text-light rounded-full px-4 py-1">
                            Ver más
                        </span>
                    </div>
                </div>
            </NuxtLink>

            <p v-if="news.length === 0" class="text-xs text-gray text-center py-4">
                No hay novedades en esta categoría.
            </p>
        </div>
    </DefaultSection>
</template>

<script setup>
const { getNews, getCategories } = useNovedades()

const categories = ref([])
const news = ref([])
const activeCategory = ref(null)
const loading = ref(true)

const formatDate = (date) => {
    if (!date) return ''
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${String(year).slice(-2)}`
}

const selectCategory = async (categoryId) => {
    const next = activeCategory.value === categoryId ? null : categoryId
    activeCategory.value = next
    loading.value = true
    news.value = await getNews(next)
    loading.value = false
}

onMounted(async () => {
    categories.value = await getCategories()
    news.value = await getNews()
    loading.value = false
})
</script>
