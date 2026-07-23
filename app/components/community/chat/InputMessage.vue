<template>
    <div class="w-full flex flex-col gap-[2px] 2xl:gap-1">
        <div class="w-fit max-w-52 flex flex-col gap-[2px] bg-midlight rounded-lg px-2 py-[6px]">
            <span class="text-xs 2xl:text-sm font-bold text-primary">{{ message.sender?.display_name }}</span>
            <p class="text-sm 2xl:text-base text-dark">{{ message.content }}</p>
        </div>
        <p class="text-xs 2xl:text-sm text-gray">{{ formatDate(message.created_at) }}</p>
    </div>
</template>

<script setup>
defineProps({
    message: {
        type: Object,
        required: true
    }
})

const formatDate = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
