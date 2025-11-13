<template>
    <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Mis hábitos</HeadingH1>
        <div class="w-full flex flex-col gap-1">
            <HabitsCard />
            <HabitsCard />
            <HabitsCard />
        </div>
    </DefaultSection>
        <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Mis hábitos comunitarios</HeadingH1>
        <div class="w-full flex flex-col gap-1">
            <HabitsCard />
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Tip de hoy</HeadingH1>
        <div class="w-full flex">
            <div class="w-3/4 bg-midlight rounded-s-lg p-3">
                <p class="text-primary text-sm">Empezá con el hábito más corto.</p>
                <p class="text-[0.625rem]">El impulso te va a ayudar con el resto.</p>
            </div>
            <div class="w-1/4 rounded-e-lg overflow-hidden">
                <NuxtImg src="/images/placeholder.png" alt="Tip de hábito" class="w-full h-full" />
            </div>
        </div>
    </DefaultSection>
</template>