<template>
    <DefaultSection>
        <HeadingH1 class="w-full">Tu progreso</HeadingH1>
        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex items-center justify-between">
                <p class="text-xs">Progreso de hoy</p>
                <p class="text-xs font-bold text-primary">60%</p>
            </div>
            <ProgressBar :progress-count="10" :goal-value="15"
                bar-color="bg-gradient-secondary" />
        </div>
        <div class="w-full flex gap-3">
            <div class="w-50% flex flex-col gap-1">
                <p class="text-xs">Tu hábito mas constante</p>
                <div class="md:h-16 w-full bg-midlight rounded-lg p-3">
                    <p class="text-xs">Correr</p>
                    <span class="text-xl font-bold text-primary">5 días</span>
                </div>
            </div>
            <div class="w-50% flex flex-col gap-1">
                <p class="text-xs">Tu porcentaje de constancia</p>
                <div class="md:h-16 w-full bg-midlight rounded-lg p-3">
                    <span class="text-[1.75rem] font-bold text-primary">87%</span>
                </div>
            </div>
        </div>
        <h2 class="w-full font-montserrat text-xl font-medium text-primary">Tus beneficios</h2>
        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex items-center justify-between">
                <span class="w-6 h-6 flex justify-center items-center bg-primary text-light text-xs font-bold rounded-full">
                    1
                </span>
                <span class="w-6 h-6 flex justify-center items-center bg-gray text-light text-xs font-bold rounded-full">
                    2
                </span>
            </div>
            <ProgressBar :progress-count="10" :goal-value="15"
                bar-color="bg-gradient-secondary" />
        </div>
        <div class="w-full flex flex-col gap-2">
            <BenefitsCard></BenefitsCard>
        </div>
    </DefaultSection>
</template>