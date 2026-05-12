<template>
    <div class="w-full flex justify-between rounded-lg p-3 bg-midlight animate-pulse">
        <div class="flex gap-3 items-center min-w-0 flex-1">
            <div class="w-8 h-8 rounded-full bg-gray/30 flex-shrink-0"></div>
            <div class="flex flex-col gap-1.5">
                <div class="h-3 bg-gray/30 rounded w-28"></div>
                <div class="flex gap-1 items-center mt-0.5">
                    <div v-for="i in 3" :key="i" class="w-3 h-3 rounded-full bg-gray/20"></div>
                </div>
            </div>
        </div>
        <div class="flex items-center flex-shrink-0">
            <div class="w-6 h-6 rounded-full bg-gray/20"></div>
        </div>
    </div>
</template>
