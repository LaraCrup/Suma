<template>
    <div class="w-full flex flex-col gap-4 animate-pulse">
        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex items-center justify-between">
                <div class="h-3 bg-gray/30 rounded w-24"></div>
                <div class="h-3 bg-gray/30 rounded w-8"></div>
            </div>
            <div class="w-full h-2 bg-gray/20 rounded-full"></div>
        </div>

        <div class="w-full flex gap-3">
            <div class="flex-1 flex flex-col gap-1">
                <div class="h-3 bg-gray/30 rounded w-3/4"></div>
                <div class="h-16 w-full bg-midlight rounded-lg"></div>
            </div>
            <div class="flex-1 flex flex-col gap-1">
                <div class="h-3 bg-gray/30 rounded w-3/4"></div>
                <div class="h-16 w-full bg-midlight rounded-lg"></div>
            </div>
        </div>

        <div class="h-5 bg-gray/30 rounded w-36"></div>

        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex items-center justify-between">
                <div class="w-6 h-6 rounded-full bg-gray/30"></div>
                <div class="w-6 h-6 rounded-full bg-gray/20"></div>
            </div>
            <div class="w-full h-2 bg-gray/20 rounded-full"></div>
            <div class="w-full flex items-center justify-between">
                <div class="h-2 bg-gray/20 rounded w-12"></div>
                <div class="h-2 bg-gray/20 rounded w-24"></div>
            </div>
        </div>

        <div class="w-full flex flex-col gap-2">
            <div v-for="i in 2" :key="i" class="w-full h-20 bg-midlight rounded-lg"></div>
        </div>
    </div>
</template>
