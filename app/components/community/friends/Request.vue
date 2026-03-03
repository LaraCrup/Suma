<template>
    <NuxtLink class="w-full flex items-center justify-between bg-midlight rounded-lg p-3">
        <div class="flex gap-3 items-center">
            <NuxtImg class="w-6 h-6 rounded-full object-cover" src="/images/placeholder.png"></NuxtImg>
            <p class="text-xs">laracrupnicoff</p>
        </div>
        <div class="flex gap-1">
            <button class="w-5 h-5 flex justify-center items-center rounded-full bg-green-light">
                <NuxtImg src="/images/icons/check.svg" alt="Brillo" class="h-2" />
            </button>
            <button class="w-5 h-5 flex justify-center items-center rounded-full bg-error">
                <svg class="w-[0.925rem] h-[0.925rem] text-light font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </NuxtLink>
</template>