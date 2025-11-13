<template>
    <DefaultSection class="h-full">
        <div class="relative w-full flex justify-between items-center">
            <NavigationBackArrow class="text-gray" />
            <NuxtImg 
                @click="showMenu = !showMenu" 
                src="/images/icons/options.svg" 
                alt="Opciones" 
                class="h-1 cursor-pointer" 
            />
            <div v-show="showMenu" class="absolute z-10 right-0 top-7">
                <ul class="w-[138px] bg-midlight rounded-xl shadow-lg">
                    <li class="flex items-center gap-2 py-3 px-4">
                        <NuxtImg src="/images/icons/edit.svg" alt="Editar" class="h-[14px]" />
                        <p class="text-xs">Editar hábito</p>
                    </li>
                    <li class="flex items-center gap-2 py-3 px-4">
                        <NuxtImg src="/images/icons/delete.svg" alt="Eliminar" class="h-[14px]" />
                        <p class="text-xs text-error">Eliminar hábito</p>
                    </li>
                </ul>
            </div>
        </div>
        <div class="h-full flex flex-col justify-center gap-5">
            <HeadingH1 class="w-full hidden">{{ habitName }}</HeadingH1>
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-secondary text-2xl">
                    🏃🏻‍♂️</div>
                <div class="flex items-center gap-3 mt-2">
                    <div class="flex gap-[2px]">
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-2 h-2" />
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-2 h-2" />
                    </div>
                    <div class="flex items-center gap-1">
                        <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                        <p class="text-[0.625rem]">8</p>
                    </div>
                </div>
            </div>
            <p class="text-center text-sm">Voy a <span class="font-bold">{{ habitName }}</span> cuando <span
                    class="font-bold">termine de trabajar</span>, para ser <span class="font-bold">una gran
                    corredora</span>.</p>
            <div>
                <div class="w-full h-3 bg-green-dark rounded-full"></div>
                <div class="w-full flex justify-center items-center gap-3 mt-3">
                    <button class="h-4 w-4 flex justify-center items-center bg-accent rounded-full text-xs">-</button>
                    <div class="flex items-end gap-2">
                        <p class="text-xl">0</p>
                        <p class="text-[0.625rem]/[2] text-gray">/<span>1</span></p>
                    </div>
                    <button class="h-4 w-4 flex justify-center items-center bg-accent rounded-full text-xs">+</button>
                </div>
            </div>
        </div>
        <div class="w-full flex justify-between items-center">
            <button class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/restart.svg" alt="Restablecer hábito" class="w-4" />
            </button>
            <button class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/check.svg" alt="Restablecer hábito" class="w-3" />
            </button>
        </div>
    </DefaultSection>
</template>

<script setup>
const route = useRoute();
const habitName = ref('');
const showMenu = ref(false);

onMounted(() => {
    habitName.value = route.params.id.replace(/-/g, ' ');
});
</script>
