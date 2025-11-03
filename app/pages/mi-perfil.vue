<template>
    <form @submit.prevent="confirmLogout" class="flex flex-col gap-2">
        <button type="submit" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
            Cerrar sesión
        </button>
        <p v-if="errorMsg" class="text-error text-sm">{{ errorMsg }}</p>
    </form>

    <div v-if="showConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 class="text-lg font-bold mb-4">¿Estás seguro?</h3>
            <p class="text-gray-600 mb-6">¿Deseas cerrar tu sesión?</p>
            <div class="flex gap-3 justify-end">
                <button
                    type="button"
                    @click="showConfirmation = false"
                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    @click="handleLogout"
                    class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                    Cerrar sesión
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
const client = useSupabaseClient();
const router = useRouter();
const errorMsg = ref('');
const showConfirmation = ref(false);

const confirmLogout = () => {
    showConfirmation.value = true;
}

const handleLogout = async () => {
    errorMsg.value = '';
    showConfirmation.value = false;

    try {
        const { error } = await client.auth.signOut();

        if (error) {
            errorMsg.value = 'No pudimos cerrar tu sesión. Por favor, intenta de nuevo.';
            return;
        }

        await router.push('/iniciar-sesion');
    } catch (error) {
        errorMsg.value = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.';
    }
}
</script>