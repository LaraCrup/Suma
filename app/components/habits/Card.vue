<template>
    <button @click="goToHabit" class="w-full flex justify-between bg-midlight rounded-lg p-3">
        <div class="flex gap-3 items-center">
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-secondary text-lg">{{ habit.icon }}</div>
            <div>
                <p class="text-xs text-start">{{ habit.name }}</p>
                <div class="flex gap-2 items-center">
                    <p class="text-[0.625rem] text-green-dark">{{ habit.progress_count || 0 }}/{{ habit.goal_value || 1 }}</p>
                    <div class="flex gap-[2px]">
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-2 h-2"/>
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-2 h-2"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <div v-if="habit.streak > 0" class="flex items-center gap-1">
                <p class="text-[0.625rem]">{{ habit.streak }}</p>
                <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
            </div>
            <div class="w-6 h-6 flex justify-center items-center border-gray border-[1px] rounded-full">
                <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-3" />
            </div>
        </div>
    </button>
</template>

<script setup>
const router = useRouter();

const props = defineProps({
    habit: {
        type: Object,
        required: true
    }
});

const goToHabit = () => {
  router.push(`/mis-habitos/${props.habit.id}`);
};
</script>