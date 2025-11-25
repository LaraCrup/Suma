<template>
    <header class="flex flex-col justify-center items-center relative bg-secondary">
        <div class="w-full bg-green-light px-6 py-1">
            <p class="text-[0.625rem] text-center text-light">{{ dailyPhrase }}</p>
        </div>
        <div class="w-full flex justify-between bg-light px-6 pb-4 mt-4">
            <div class="flex gap-2 items-center">
                <NuxtImg src="/images/isotipo.svg" alt="Logo Suma" class="w-4" />
                <p class="text-[0.625rem]">Hola, <span class="font-bold text-primary">{{ userName }}</span></p>
            </div>
            <div class="flex items-center gap-2">
                <p class="text-[0.625rem]">Nivel</p>
                <div class="w-6 h-6 flex justify-center items-center bg-primary rounded-full">
                    <p class="text-xs text-light font-bold">1</p>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup>
import { useAuthStore } from '~/stores/authStore'
import { computed, ref, onMounted, watch } from 'vue'

const authStore = useAuthStore()

const phrases = [
    'Hoy es un buen día para sumar',
    'Cada hábito te acerca más a quien quieres ser',
    'Pequeños pasos, grandes cambios'
]

const dailyPhrase = ref('')

const userName = computed(() => {
    return authStore.profile?.name
})

onMounted(() => {
    if (typeof window !== 'undefined') {
        const savedPhrase = sessionStorage.getItem('sessionPhrase')

        if (savedPhrase) {
            dailyPhrase.value = savedPhrase
        } else {
            const randomIndex = Math.floor(Math.random() * phrases.length)
            const selectedPhrase = phrases[randomIndex]
            sessionStorage.setItem('sessionPhrase', selectedPhrase)
            dailyPhrase.value = selectedPhrase
        }
    }
})

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
    if (!isLoggedIn && typeof window !== 'undefined') {
        sessionStorage.removeItem('sessionPhrase')
        dailyPhrase.value = ''
    }
})
</script>