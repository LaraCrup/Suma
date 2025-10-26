<template>
    <div class="w-full flex justify-center items-center gap-2">
        <NuxtImg src="/images/icons/error.svg" alt="Error" class="w-3" />
        <p class="text-error text-xs">
            <slot />
        </p>
    </div>
</template>