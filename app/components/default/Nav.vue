<template>
    <div class="w-full pt-3">
        <nav class="w-full bg-primary rounded-t-[32px] px-5 py-3">
            <ul class="w-full flex items-center justify-between gap-2">
                <li class="w-[3.25rem]">
                    <NuxtLink :to="ROUTE_NAMES.PROGRESS" class="flex flex-col items-center justify-between gap-1">
                        <NuxtImg src="/images/nav/progreso.svg" alt="Progreso" class="w-[0.875rem]" />
                        <p class="text-[0.5rem] text-light">Progreso</p>
                    </NuxtLink>
                </li>
                <li class="w-[3.25rem]">
                    <NuxtLink :to="ROUTE_NAMES.COMMUNITY" class="flex flex-col items-center justify-between gap-1">
                        <NuxtImg src="/images/nav/comunidades.svg" alt="Comunidades" class="w-[1.375rem]" />
                        <p class="text-[0.5rem] text-light">Comunidades</p>
                    </NuxtLink>
                </li>
                <li class="w-10 h-10 flex items-center justify-center bg-accent rounded-full -mt-6 shadow-lg">
                    <NuxtLink :to="ROUTE_NAMES.HOME">
                        <NuxtImg src="/images/nav/habitos.svg" alt="habitos" class="w-5" />
                    </NuxtLink>
                </li>
                <li class="w-[3.25rem]">
                    <NuxtLink :to="ROUTE_NAMES.NEWS" class="flex flex-col items-center justify-between gap-1">
                        <NuxtImg src="/images/nav/novedades.svg" alt="Novedades" class="w-4" />
                        <p class="text-[0.5rem] text-light">Novedades</p>
                    </NuxtLink>
                </li>
                <li class="w-[3.25rem]">
                    <NuxtLink :to="ROUTE_NAMES.PROFILE" class="flex flex-col items-center justify-between gap-1">
                        <NuxtImg src="/images/nav/perfil.svg" alt="Perfil" class="w-[0.875rem]" />
                        <p class="text-[0.5rem] text-light">Perfil</p>
                    </NuxtLink>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES';
</script>