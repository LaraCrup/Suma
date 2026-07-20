<template>
    <div class="w-full flex items-center gap-2">
        <NuxtImg src="/images/icons/error.svg" alt="Error" class="w-3" />
        <p class="text-error text-xs 2xl:text-sm">
            <slot />
        </p>
    </div>
</template>