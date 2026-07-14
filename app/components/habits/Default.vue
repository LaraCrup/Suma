<template>
    <DefaultSection class="pb-12">
        <HeadingH1 class="w-full">Nuevo hábito</HeadingH1>
        <div class="w-full flex flex-col items-center gap-2">
            <div class="w-full flex justify-between items-center">
                <div v-for="category in defaultHabits" :key="category.name" @click="selectedCategory = category" :class="['w-8 h-8 flex justify-center items-center rounded-full cursor-pointer', selectedCategory.name === category.name ? 'bg-accent' : 'bg-gradient-secondary']">
                    <NuxtImg :src="`/images/habitsCategories/${category.icon}${selectedCategory.name === category.name ? '-selected' : ''}.svg`" :alt="category.name" class="max-h-4 max-w-4 w-full h-full object-contain" />
                </div>
            </div>
            <p class="text-xs font-bold">{{ selectedCategory.name }}</p>
        </div>
        <div class="w-full flex flex-col gap-2">
            <HabitsNewDefault
                v-for="habit in selectedCategory.habits"
                :key="habit.name"
                :icon="habit.icon"
                :name="habit.name"
                @select="selectHabit(habit)"
                :is-selected="selectedHabit?.name === habit.name"
            />
        </div>
        <ButtonPrimary @click="goToDetails" :disabled="!selectedHabit">Siguiente</ButtonPrimary>
    </DefaultSection>
    <div class="fixed w-max flex gap-2 text-light bg-green-light px-5 py-2 rounded-full bottom-20 left-1/2 -translate-x-1/2 cursor-pointer 2xl:bottom-10 2xl:left-[calc(50%+8rem)]" @click="startCustom">
        <NuxtImg src="/images/brillo-blanco.svg" alt="Cerrar" class="w-3" />
        <p class="text-xs">Hábito personalizado</p>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useHabitStore } from '~/stores/habitStore'

const defaultHabits = [
    {
        name: 'Populares',
        icon: 'popular',
        habits: [
            { name: 'Correr',
              icon: '🏃‍♀️',
            },
            { name: 'Tomar agua',
              icon: '💧',
            },
            { name: 'Meditar',
              icon: '🧘🏻‍♀',
            },
            { name: 'Ejercicio',
              icon: '💪',
            },
            { name: 'Leer',
              icon: '📚',
            },
            { name: 'Comer fruta',
              icon: '🍎',
            },
            { name: 'Tiempo en familia',
              icon: '🏠',
            },
            { name: 'Estudiar',
              icon: '📖',
            },
            { name: 'Tomar vitaminas',
              icon: '💊',
            },
        ]
    },
    {
        name: 'Salud',
        icon: 'salud',
        habits: [
            { name: 'Dormir',
              icon: '😴',
            },
            { name: 'Tomar vitaminas',
              icon: '💊',
            },
            { name: 'Comer frutas',
              icon: '🍎',
            },
            { name: 'Comer vegetales',
              icon: '🥗',
            },
            { name: 'Pesarse',
              icon: '⚖️',
            },
            { name: 'Tomar agua',
              icon: '💧',
            },
        ]
    },
    {
        name: 'Fitness',
        icon: 'fitness',
        habits: [
            { name: 'Ejercicio',
              icon: '💪',
            },
            { name: 'Elongar',
              icon: '🙆‍♀️',
            },
            { name: 'Ir al gimnasio',
              icon: '🏋️‍♀️',
            },
            { name: 'Yoga',
              icon: '🧘‍♀️',
            },
            { name: 'Correr',
              icon: '🏃‍♀️',
            },
            { name: 'Nadar',
              icon: '🏊‍♀️',
            },
            { name: 'Ciclismo',
              icon: '🚴‍♀️',
            },
            {
              name: 'Caminar',
              icon: '🚶‍♀️',
            },
            {
              name: 'Jugar deporte',
              icon: '🏀',
            },
        ]
    },
    {
        name: 'Wellness',
        icon: 'wellness',
        habits: [
            { name: 'Meditación',
              icon: '🧘🏻‍♀',
            },
            { name: 'Respiración profunda',
              icon: '🌬️',
            },
            { name: 'Salir afuera',
              icon: '☀️',
            },
            { name: 'Masaje',
              icon: '💆‍♀️',
            },
            { name: 'Rezar',
              icon: '🙏',
            },
            { name: 'Journaling',
              icon: '📝',
            },
        ]
    },
    {
        name: 'Educación',
        icon: 'educacion',
        habits: [
            { name: 'Leer libro',
              icon: '📚',
            },
            { name: 'Aprender idioma',
              icon: '🗣️',
            },
            { name: 'Curso online',
              icon: '💻',
            },
            { name: 'Estudiar',
              icon: '📖',
            },
            { name: 'Hacer Tarea',
              icon: '📝',
            },
        ]
    },
    {
        name: 'Relaciones',
        icon: 'relaciones',
        habits: [
            { name: 'Tiempo en familia',
              icon: '🏠',
            },
            { name: 'Llamar a familia',
              icon: '☎️',
            },
            { name: 'Llamar a amigos',
              icon: '👫',
            },
            { name: 'Escribir a amigos',
              icon: '💬',
            },
            { name: 'Agradecer',
              icon: '😊',
            },
            { name: 'Ayudar a alguien',
              icon: '🤝',
            },
            { name: 'Hablar a alguien nuevo',
              icon: '🗣️',
            },
        ]
    }
];

const selectedCategory = ref(defaultHabits[0])
const selectedHabit = ref(null)
const habitStore = useHabitStore()

const selectHabit = (habit) => {
    if (selectedHabit.value?.name === habit.name) {
        selectedHabit.value = null
    } else {
        selectedHabit.value = habit
    }
}

const startCustom = () => {
    habitStore.setCustomHabit()
}

const goToDetails = () => {
    if (selectedHabit.value) {
        habitStore.setSelectedHabit(selectedHabit.value)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
}
</script>
