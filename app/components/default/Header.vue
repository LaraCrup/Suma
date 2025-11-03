<template>
    <header class="flex flex-col justify-center items-center relative bg-secondary lg:px-24">
        <div class="w-full bg-green-light px-6 py-1">
            <p class="text-[0.625rem] text-center text-light">Hoy es un buen día para sumar</p>
        </div>
        <div class="w-full flex justify-between bg-light px-6 mt-4">
            <div class="flex gap-2 items-center">
                <NuxtImg src="/images/isotipo.svg" alt="Logo Unike Group" class="w-4" />
                <p class="text-[0.625rem]">Hola, <span class="font-bold text-primary">Lara</span></p>
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