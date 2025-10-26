<template>
  <div class="w-full cursor-pointer" @click="goBack">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" :class="props.color">
      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12l6 6m-6-6l6-6"/>
    </svg>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  color: {
    type: String,
    default: ''
  },
  url: {
    type: String,
    default: null
  }
})

const router = useRouter()

const goBack = () => {
  if (props.url) {
    router.push(props.url)
  } else {
    router.go(-1)
  }
}
</script>