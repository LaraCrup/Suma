<template>
    <DefaultSection class="h-full">
        <div v-if="loading" class="w-full flex justify-center py-8">
            <Loader />
        </div>

        <template v-else-if="benefit">
            <div class="w-full">
                <NavigationBackArrow :url="ROUTE_NAMES.PROGRESS" />
            </div>

            <div class="2xl:max-w-[500px] flex-1 w-full flex flex-col justify-center items-center gap-5">
                <NuxtImg
                    class="w-full h-40 2xl:h-60 rounded-xl object-cover"
                    :src="benefit.image_url || '/images/placeholder.png'"
                    :alt="benefit.title"
                />
                <h1 v-if="benefit.description" class="w-full text-sm 2xl:text-base text-center">
                    {{ benefit.description }}
                </h1>
                <div v-if="benefit.discount_code" class="w-full flex flex-col gap-1">
                    <p class="text-xs 2xl:text-sm text-center text-dark">Tu código de descuento:</p>
                    <div class="w-full flex justify-center bg-midlight rounded-lg p-3">
                        <span class="font-montserrat font-bold 2xl:text-xl text-primary tracking-wide">
                            {{ benefit.discount_code }}
                        </span>
                    </div>
                </div>
                <div v-if="benefit.terms_conditions" class="w-full">
                    <button
                        class="w-full flex items-center justify-between text-xs 2xl:text-sm"
                        @click="showTerms = !showTerms"
                    >
                        <span>*Términos y Condiciones</span>
                        <NuxtImg
                            :src="showTerms ? '/images/icons/minimize.svg' : '/images/icons/maximize.svg'"
                            alt="Expandir"
                            class="w-3 h-3"
                        />
                    </button>
                    <Transition
                        enter-active-class="transition-all duration-300 ease-out overflow-hidden"
                        enter-from-class="opacity-0 max-h-0"
                        enter-to-class="opacity-100 max-h-40"
                        leave-active-class="transition-all duration-200 ease-in overflow-hidden"
                        leave-from-class="opacity-100 max-h-40"
                        leave-to-class="opacity-0 max-h-0"
                    >
                        <p v-if="showTerms" class="mt-2 text-xs 2xl:text-sm text-gray">
                            {{ benefit.terms_conditions }}
                        </p>
                    </Transition>
                </div>
            </div>

            <a
                v-if="benefit.brands?.website"
                :href="benefit.brands.website"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full max-w-[480px] flex justify-center text-center text-xs text-primary border border-primary rounded-full py-3 px-12 bg-light"
            >Visitar sitio</a>
        </template>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'

const route = useRoute()
const client = useSupabaseClient()

const loading = ref(true)
const benefit = ref(null)
const showTerms = ref(false)

const loadBenefit = async () => {
    try {
        const { data, error } = await client
            .from('benefits')
            .select('id, title, image_url, description, discount_code, terms_conditions, valid_until, brands ( name, image_url, website )')
            .eq('id', route.params.id)
            .eq('status', 'approved')
            .single()

        if (error) {
            console.error('Error cargando beneficio:', error)
            return
        }

        benefit.value = data
    } catch (error) {
        console.error('Error cargando beneficio:', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadBenefit()
})
</script>
