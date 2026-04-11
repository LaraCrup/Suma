<template>
    <div class="w-full flex flex-col items-end gap-[2px]">
        <div class="w-fit max-w-52 flex flex-col items-end gap-[2px] bg-[#D7F560]/60 rounded-lg px-2 py-[6px]">
            <span class="text-[0.625rem] font-bold text-primary">{{ message.sender?.display_name }}</span>
            <p class="text-sm text-dark">{{ message.content }}</p>
        </div>
        <p class="text-[0.625rem] text-gray">{{ formatDate(message.created_at) }}</p>
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
    return d.toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
