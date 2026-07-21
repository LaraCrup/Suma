<template>
    <DefaultSection>
        <div class="w-full flex flex-col gap-3">
            <HeadingH1 class="w-full">Novedades</HeadingH1>
    
            <div class="w-full flex gap-1 2xl:gap-2 overflow-x-auto" style="-ms-overflow-style:none;scrollbar-width:none">
                <button
                    v-for="cat in categories"
                    :key="cat.id"
                    @click="selectCategory(cat.id)"
                    :class="[
                        'flex-shrink-0 text-xs 2xl:text-base px-3 2xl:px-5 py-2 rounded-lg border border-green-light transition-colors',
                        activeCategory === cat.id
                            ? 'bg-green-light text-light'
                            : 'bg-light text-dark'
                    ]"
                >
                    {{ cat.name }}
                </button>
            </div>
        </div>

        <div v-if="loading" class="w-full grid grid-cols-1 2xl:grid-cols-2 gap-3">
            <SkeletonNewsCard v-for="i in 3" :key="i" />
        </div>

        <div v-else class="w-full grid grid-cols-1 2xl:grid-cols-2 gap-3">
            <NuxtLink
                v-for="item in news"
                :key="item.id"
                :to="`/novedades/${item.id}`"
                class="block w-full rounded-lg overflow-hidden"
            >
                <div class="relative h-32 2xl:h-44 bg-midlight flex items-end p-3">
                    <NuxtImg
                        v-if="item.image_url"
                        :src="item.image_url"
                        :alt="item.title"
                        class="absolute inset-0 w-full h-32 2xl:h-44 object-cover rounded-lg"
                    />
                    <span class="relative z-10 text-xs 2xl:text-sm bg-accent text-green-dark px-2 2xl:px-3 py-1 rounded-full">
                        {{ item.category?.name }}
                    </span>
                </div>

                <div class="bg-midlight p-3 flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2 2xl:gap-4">
                            <NuxtImg
                                :src="item.brand.image_url"
                                :alt="item.brand?.name"
                                class="w-6 2xl:w-7 h-6 2xl:h-7 rounded-full object-cover flex-shrink-0"
                            />
                            <span class="text-xs 2xl:text-sm text-dark">Por {{ item.brand?.name }}</span>
                        </div>
                        <span class="text-xs 2xl:text-sm text-gray">{{ formatDate(item.publication_date) }}</span>
                    </div>
                    <div class="w-full flex flex-col gap-2">
                        <p class="text-sm 2xl:text-base font-bold text-dark leading-tight">{{ item.title }}</p>
    
                        <p class="text-xs 2xl:text-sm text-dark line-clamp-3">{{ item.content }}</p>
                    </div>
                    <div class="flex justify-end">
                        <span class="bg-green-light text-xs 2xl:text-sm text-light rounded-full px-4 py-1">
                            Ver más
                        </span>
                    </div>
                </div>
            </NuxtLink>

            <p v-if="news.length === 0" class="w-full 2xl:col-span-2 text-xs text-gray text-center py-4">
                No hay novedades en esta categoría.
            </p>
        </div>
    </DefaultSection>
</template>

<script setup>
const { getNews, getCategories } = useNovedades()
const { registerRefresh } = usePullToRefresh()

const categories = ref([])
const news = ref([])
const activeCategory = ref(null)
const loading = ref(true)

const CACHE_KEY = 'novedades_last_fetch'
const CACHE_TTL = 5 * 60 * 1000

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

const loadData = async (force = false) => {
    if (!force && typeof window !== 'undefined') {
        try {
            const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY))
            if (cached && Date.now() - cached.ts < CACHE_TTL) {
                categories.value = cached.categories
                news.value = cached.news
                loading.value = false
                return
            }
        } catch (e) {}
    }
    loading.value = true
    categories.value = await getCategories()
    news.value = await getNews(activeCategory.value)
    if (typeof window !== 'undefined' && !activeCategory.value) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            categories: categories.value,
            news: news.value
        }))
    }
    loading.value = false
}

onMounted(() => {
    loadData()
    registerRefresh(() => loadData(true))
})
</script>
