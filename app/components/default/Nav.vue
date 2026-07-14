<template>
    <div class="w-full relative z-10 rounded-t-[32px] 2xl:w-auto 2xl:h-full 2xl:rounded-none" style="grid-area: nav;">
        <nav class="w-full bg-primary rounded-t-[32px] px-5 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] 2xl:w-64 2xl:h-full 2xl:rounded-t-none 2xl:shadow-[4px_0_12px_rgba(0,0,0,0.15)] 2xl:px-4 2xl:py-8">
            <div class="hidden 2xl:flex items-center gap-3 px-3 mb-8">
                <span class="w-10 h-10 flex items-center justify-center bg-light rounded-xl">
                    <NuxtImg src="/images/isotipo.svg" alt="Logo Suma" class="w-6" />
                </span>
                <p class="text-light font-montserrat font-bold text-lg">Suma</p>
            </div>
            <ul class="w-full flex items-center justify-between gap-2 2xl:flex-col 2xl:items-stretch 2xl:justify-start 2xl:gap-2">
                <li class="w-[3.25rem] h-full 2xl:w-full 2xl:h-auto">
                    <NuxtLink :to="ROUTE_NAMES.PROGRESS" class="h-full flex flex-col items-center justify-between gap-1 2xl:flex-row 2xl:justify-start 2xl:gap-4 2xl:px-3 2xl:py-3 2xl:rounded-2xl 2xl:hover:bg-white/10">
                        <span class="2xl:w-8 2xl:flex 2xl:items-center 2xl:justify-center">
                            <NuxtImg src="/images/nav/progreso.svg" alt="Progreso" class="w-[0.875rem] 2xl:w-5" />
                        </span>
                        <p class="text-[0.5rem] text-light 2xl:text-base">Progreso</p>
                    </NuxtLink>
                </li>
                <li class="w-[3.25rem] h-full 2xl:w-full 2xl:h-auto">
                    <NuxtLink :to="ROUTE_NAMES.COMMUNITY" class="h-full flex flex-col items-center justify-between gap-1 2xl:flex-row 2xl:justify-start 2xl:gap-4 2xl:px-3 2xl:py-3 2xl:rounded-2xl 2xl:hover:bg-white/10">
                        <span class="2xl:w-8 2xl:flex 2xl:items-center 2xl:justify-center">
                            <NuxtImg src="/images/nav/comunidades.svg" alt="Comunidades" class="w-[1.375rem] 2xl:w-7" />
                        </span>
                        <p class="text-[0.5rem] text-light 2xl:text-base">Comunidades</p>
                    </NuxtLink>
                </li>
                <li class="w-10 h-10 flex items-center justify-center bg-accent rounded-full -mt-9 shadow-lg 2xl:order-first 2xl:w-full 2xl:h-auto 2xl:mt-0 2xl:bg-transparent 2xl:rounded-none 2xl:shadow-none 2xl:justify-start">
                    <NuxtLink :to="ROUTE_NAMES.HOME" class="2xl:w-full 2xl:flex 2xl:items-center 2xl:gap-4 2xl:px-3 2xl:py-3 2xl:rounded-2xl 2xl:hover:bg-white/10">
                        <span class="2xl:w-8 2xl:h-8 2xl:flex 2xl:items-center 2xl:justify-center 2xl:bg-accent 2xl:rounded-full">
                            <NuxtImg src="/images/nav/habitos.svg" alt="Hábitos" class="w-5 2xl:w-4" />
                        </span>
                        <p class="hidden 2xl:block text-light 2xl:text-base">Mis hábitos</p>
                    </NuxtLink>
                </li>
                <li class="w-[3.25rem] h-full 2xl:w-full 2xl:h-auto">
                    <NuxtLink :to="ROUTE_NAMES.NEWS" class="h-full flex flex-col items-center justify-between gap-1 2xl:flex-row 2xl:justify-start 2xl:gap-4 2xl:px-3 2xl:py-3 2xl:rounded-2xl 2xl:hover:bg-white/10">
                        <span class="2xl:w-8 2xl:flex 2xl:items-center 2xl:justify-center">
                            <NuxtImg src="/images/nav/novedades.svg" alt="Novedades" class="w-4 2xl:w-5" />
                        </span>
                        <p class="text-[0.5rem] text-light 2xl:text-base">Novedades</p>
                    </NuxtLink>
                </li>
                <li class="w-[3.25rem] h-full 2xl:w-full 2xl:h-auto">
                    <NuxtLink :to="ROUTE_NAMES.PROFILE" class="h-full flex flex-col items-center justify-between gap-1 2xl:flex-row 2xl:justify-start 2xl:gap-4 2xl:px-3 2xl:py-3 2xl:rounded-2xl 2xl:hover:bg-white/10">
                        <span class="2xl:w-8 2xl:flex 2xl:items-center 2xl:justify-center">
                            <NuxtImg src="/images/nav/perfil.svg" alt="Perfil" class="w-[0.875rem] 2xl:w-5" />
                        </span>
                        <p class="text-[0.5rem] text-light 2xl:text-base">Perfil</p>
                    </NuxtLink>
                </li>
            </ul>
        </nav>
    </div>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES';
</script>
