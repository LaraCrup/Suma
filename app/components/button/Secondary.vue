<template>
    <NuxtLink v-if="to" :to="to"
        class="inline-block w-full max-w-[480px] bg-green-light text-center text-light text-xs rounded-full py-3 px-10">
        <slot />
    </NuxtLink>
    <button v-else type="button" :disabled="disabled"
        :class="['inline-block w-full max-w-[480px] text-center text-light text-xs rounded-full py-3 px-10', disabled ? 'bg-gray' : 'bg-green-light']">
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