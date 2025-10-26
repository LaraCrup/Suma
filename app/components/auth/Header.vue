<template>
    <header class="flex justify-center bg-light py-5">
        <NuxtLink :to="ROUTE_NAMES.LOGIN">
            <NuxtImg src="/images/isotipo.svg" alt="Logo Suma" class="w-9" />
        </NuxtLink>
    </header>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES';
</script>