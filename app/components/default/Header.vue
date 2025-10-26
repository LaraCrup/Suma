<template>
    <header class="flex justify-center items-center relative bg-secondary p-6 lg:px-24">
        <button @click="toggleDrawer"
            class="flex flex-col justify-center items-center gap-1 absolute left-6 lg:left-24 transition-all duration-300">
            <Icon name="tabler:menu-2" class="w-7 h-7 lg:w-9 lg:h-9 text-light" />
        </button>

        <NuxtLink :to="ROUTE_NAMES.HOME">
            <NuxtImg src="/images/isotipo.svg" alt="Logo Unike Group" class="h-10 lg:h-[3.25rem]" />
        </NuxtLink>

        <NavDrawer :is-open="isDrawerOpen" @close="closeDrawer" />
    </header>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES';

const isDrawerOpen = ref(false)

const toggleDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value
}

const closeDrawer = () => {
    isDrawerOpen.value = false
}

const route = useRoute()
watch(() => route.path, () => {
    closeDrawer()
})
</script>