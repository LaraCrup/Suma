<template>
    <DefaultSection>
        <div class="relative w-full flex items-center">
            <NavigationBackArrow class="absolute text-gray" />
            <HeadingH2 class="text-center">🏃🏻‍♂️ Correr</HeadingH2>
        </div>
        <div class="w-full flex flex-col gap-4">
            <FormTextFieldSecondary v-model="habitName" id="habit-name" label="Nombre del hábito"
                placeholder="Ejemplo: Beber agua" :error="habitNameError" required />
            <FormTextFieldSecondary v-model="habitName" id="habit-name" label="Nombre del hábito"
                placeholder="Ejemplo: Beber agua" :error="habitNameError" required />
            <FormTextFieldSecondary v-model="habitName" id="habit-name" label="Nombre del hábito"
                placeholder="Ejemplo: Beber agua" :error="habitNameError" required />
        </div>
        <div class="w-full flex justify-between items-center">
            <FormLabelSecondary>Icono del hábito</FormLabelSecondary>
            <input type="text" class="w-8 text-xl text-center" placeholder="❇️" />
        </div>
        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex justify-between items-center">
                <FormLabelSecondary>Frecuencia</FormLabelSecondary>
                <input type="text" class="w-fit text-right text-xs text-dark font-bold" placeholder="Diario" />
            </div>
            <div class="w-full flex justify-end items-center">
                <FormLabelSecondary class="sr-only">Frecuencia</FormLabelSecondary>
                <input type="text" class="w-fit text-right text-xs text-dark font-bold" placeholder="Diario" />
            </div>
            <div class="w-full flex justify-between items-center">
                <FormLabelSecondary>Meta</FormLabelSecondary>
                <div class="w-fit flex items-center gap-1">
                    <input type="text" class="w-12 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1" placeholder="2" />
                    <input type="text" class="w-12 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1" placeholder="km" />
                    <p class="text-xs text-dark">/diario</p>
                </div>
            </div>
        </div>
        <div class="w-full bg-green-dark rounded p-1">
            <p class="text-center text-xs text-light">Completar 2km cada día</p>
        </div>
        <div class="w-full flex justify-between items-center">
            <FormLabelSecondary>Recordatorios</FormLabelSecondary>
            <FormSwitch id="habit-reminders" v-model="habitReminders" />
        </div>
        <ButtonPrimary>Crear hábito</ButtonPrimary>
    </DefaultSection>
</template>