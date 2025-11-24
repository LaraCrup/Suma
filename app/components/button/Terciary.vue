<template>
    <NuxtLink v-if="to" :to="to"
        class="w-full max-w-[480px] flex justify-center bg-light text-center text-primary text-xs border border-primary rounded-full py-3 px-12">
        <slot />
    </NuxtLink>
    <button v-else type="button"
        :disabled="disabled"
        :class="['w-full max-w-[480px] flex justify-center text-center text-xs border border-primary rounded-full py-3 px-12 transition-colors', disabled ? 'bg-gray text-light border-none cursor-not-allowed' : 'bg-light text-primary']">
        <slot />
    </button>
</template>

<script>
export default {
    props: {
        to: {
            type: [String, Object],
            default: null
        },
        disabled: {
            type: Boolean,
            default: false
        }
    }
}
</script>