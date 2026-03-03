<template>
    <div
        class="w-full flex justify-between rounded-lg p-3 bg-midlight">
        <div class="flex gap-3 items-center">
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-secondary"><p class="text-sm leading-3"></p></div>
            <div>
                <p class="text-xs text-start">Run club 🏃🏻‍♂️🥵</p>
                <p class="text-[0.625rem] text-green-dark font-normal">8 participantes</p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
                <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                <p class="text-[0.625rem]">4</p>
            </div>
            <div class="w-6 h-6 flex justify-center items-center rounded-full border-gray border-[1px]">
                <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-3" />
            </div>
        </div>
    </div>
</template>