<template>
    <button
        @click="goToHabit"
        :class="['w-full flex justify-between rounded-lg p-3 transition-colors', myMember?.completed ? 'bg-accent' : 'bg-midlight']">
        <div class="flex gap-3 items-center">
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-secondary">
                <p class="text-sm leading-3">{{ habit?.icon ?? '✨' }}</p>
            </div>
            <div>
                <p class="text-xs text-start">{{ habit?.name ?? 'Hábito compartido' }}</p>
                <div class="flex gap-1 items-center mt-1">
                    <template v-for="member in visibleMembers" :key="member.id">
                        <div
                            class="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center"
                            :class="member.completed ? 'bg-green-light' : 'bg-gray'">
                            <img
                                v-if="member.completed && member.avatar_url"
                                :src="member.avatar_url"
                                :alt="member.display_name"
                                class="w-full h-full object-cover"
                            />
                            <span
                                v-else-if="member.completed"
                                class="text-[0.5rem] text-light font-bold">
                                {{ member.display_name?.[0] }}
                            </span>
                        </div>
                    </template>
                    <div
                        v-if="extraCount > 0"
                        class="w-5 h-5 rounded-full bg-gray flex items-center justify-center">
                        <span class="text-[0.5rem] text-light">+{{ extraCount }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex items-center">
            <div :class="['w-6 h-6 flex justify-center items-center rounded-full', myMember?.completed ? 'bg-green-dark' : 'border-gray border-[1px]']">
                <NuxtImg
                    :src="myMember?.completed ? '/images/icons/brillo-light-green.svg' : '/images/brillo.svg'"
                    :alt="myMember?.completed ? 'Completado' : 'Pendiente'"
                    class="w-3"
                />
            </div>
        </div>
    </button>
</template>

<script setup>
import { computed } from 'vue'

const router = useRouter()
const authStore = useAuthStore()

const props = defineProps({
    habit: {
        type: Object,
        default: null
    },
    members: {
        type: Array,
        default: () => []
    }
})

const MAX_VISIBLE = 5

const visibleMembers = computed(() => props.members.slice(0, MAX_VISIBLE))
const extraCount = computed(() => Math.max(0, props.members.length - MAX_VISIBLE))
const myMember = computed(() => props.members.find(m => m.id === authStore.user?.id))

const goToHabit = () => {
    if (props.habit?.community_id) {
        router.push(`/comunidades/${props.habit.community_id}/habito`)
    }
}
</script>
