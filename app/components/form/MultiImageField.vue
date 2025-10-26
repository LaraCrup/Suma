<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel :id="id" :required="required" v-if="label">{{ label }}</FormLabel>

        <div class="flex flex-col gap-3">
            <div @click="triggerFileInput" @dragover.prevent @dragenter.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop"
                class="bg-light border-2 border-dashed rounded-[5px] text-center cursor-pointer transition-colors p-6"
                :class="{
                    'border-primary bg-primary/5': isDragging,
                    'border-gray-300': !isDragging && images.length === 0,
                    'border-gray-400': !isDragging && images.length > 0
                }">
                <div class="space-y-2">
                    <Icon name="tabler:cloud-upload" class="w-8 h-8 text-dark mx-auto" />
                    <p class="text-dark font-medium">
                        {{ images.length === 0 ? 'Haz clic aquí o arrastra imágenes' : 'Agregar más imágenes' }}
                    </p>
                    <p class="text-sm text-dark font-light">
                        Puedes seleccionar múltiples archivos a la vez<br>
                        Formatos admitidos: JPG, PNG, WEBP, GIF (máx. 5MB c/u)
                    </p>
                </div>
            </div>

            <input ref="fileInput" type="file" accept="image/*" multiple @change="handleFileSelect" class="hidden"
                :id="inputId" />

            <div v-if="images.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div v-for="(image, index) in images" :key="`image-${index}`"
                    class="relative group bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="aspect-square flex items-center justify-center bg-gray-50">
                        <img v-if="image.preview || image.url" :src="image.preview || image.url" :alt="image.name"
                            class="w-full h-full object-cover" />
                        <div v-else class="flex flex-col items-center justify-center p-4">
                            <Icon name="tabler:photo" class="w-8 h-8 text-gray-400 mb-2" />
                            <p class="text-xs text-gray-500 text-center break-all">{{ image.name }}</p>
                        </div>
                    </div>

                    <div
                        class="flex flex-col justify-center items-center gap-4 absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="flex items-center gap-4">
                            <button v-if="index > 0" type="button" @click.stop="moveImage(index, index - 1)"
                                class="w-12 h-12 flex flex-col justify-center items-center bg-secondary text-white p-2 rounded-full hover:bg-secondary/75 transition-colors duration-300">
                                <Icon name="tabler:arrow-left" class="w-6 h-6" />
                            </button>
                            <button v-if="index < images.length - 1" type="button"
                                @click.stop="moveImage(index, index + 1)"
                                class="w-12 h-12 flex flex-col justify-center items-center bg-secondary text-white p-2 rounded-full hover:bg-secondary/75 transition-colors duration-300">
                                <Icon name="tabler:arrow-right" class="w-6 h-6" />
                            </button>
                        </div>

                        <button type="button" @click.stop="removeImage(index)"
                            class="w-12 h-12 flex flex-col justify-center items-center bg-primary text-white p-2 rounded-full hover:bg-primary/75 transition-colors duration-300">
                            <Icon name="tabler:trash" class="w-6 h-6" />
                        </button>
                    </div>

                    <div v-if="index === 0"
                        class="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-medium">
                        Principal
                    </div>

                    <div
                        class="absolute top-2 right-2 bg-white text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                        {{ index + 1 }}
                    </div>
                </div>
            </div>

            <div v-if="uploading" class="w-full">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Procesando imágenes...</span>
                    <span class="text-sm text-gray-600">{{ Math.round(uploadProgress) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-primary h-2 rounded-full transition-all duration-300"
                        :style="{ width: uploadProgress + '%' }"></div>
                </div>
            </div>

            <div v-if="images.length > 0" class="text-sm text-gray-600">
                {{ images.length }} {{ images.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas' }}
            </div>
        </div>

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: Array,
        default: () => []
    },
    label: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
    },
    required: {
        type: Boolean,
        default: false
    },
    id: {
        type: String,
        required: true,
    },
    maxSize: {
        type: Number,
        default: 5 * 1024 * 1024
    },
    maxFiles: {
        type: Number,
        default: 10
    }
})

const emit = defineEmits(['update:modelValue', 'upload-start', 'upload-complete', 'upload-error'])

const fileInput = ref(null)
const images = ref([])
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const showError = ref(false)
const isUpdatingFromParent = ref(false)

const inputId = computed(() => props.id)

watch(() => props.modelValue, (newValue) => {
    if (isUpdatingFromParent.value) return

    isUpdatingFromParent.value = true

    if (newValue && Array.isArray(newValue) && newValue.length > 0) {
        images.value = newValue.map((img, index) => ({
            id: img.id || `existing-${index}`,
            name: img.filename || img.name || `imagen-${index + 1}.jpg`,
            preview: img.url,
            url: img.url,
            file: null,
            isExisting: true,
            ...img
        }))
    } else if (!newValue || newValue.length === 0) {
        images.value = []
    }

    nextTick(() => {
        isUpdatingFromParent.value = false
    })
}, { immediate: true, deep: true })

watch(images, (newImages) => {
    if (isUpdatingFromParent.value) return

    const formattedImages = newImages.map((img, index) => ({
        id: img.id,
        name: img.name,
        url: img.url,
        preview: img.preview,
        file: img.file,
        isExisting: img.isExisting || false,
        orden: index + 1,
        es_principal: index === 0,
        filename: img.filename || img.name,
        file_size: img.file_size || (img.file ? img.file.size : 0),
        mime_type: img.mime_type || (img.file ? img.file.type : 'image/jpeg')
    }))


    emit('update:modelValue', formattedImages)
}, { deep: true })

const triggerFileInput = () => {
    fileInput.value?.click()
}

const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

    if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no permitido. Solo se permiten: JPEG, PNG, WebP, GIF')
    }

    if (file.size > props.maxSize) {
        throw new Error(`El archivo no debe superar ${Math.round(props.maxSize / 1024 / 1024)}MB`)
    }

    return true
}

const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
        processFiles(files)
    }
}

const handleDrop = (event) => {
    isDragging.value = false
    const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
        processFiles(files)
    }
}


const processFiles = async (files) => {
    try {
        const currentCount = images.value.length
        const newCount = files.length
        const totalCount = currentCount + newCount

        if (totalCount > props.maxFiles) {
            throw new Error(`Máximo ${props.maxFiles} imágenes permitidas. Selecciona ${props.maxFiles - currentCount} imágenes o menos.`)
        }

        uploading.value = true
        uploadProgress.value = 0
        emit('upload-start', files)

        const newImages = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            try {
                validateFile(file)

                const imageData = await new Promise((resolve) => {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                        resolve({
                            id: `new-${Date.now()}-${i}`,
                            name: file.name,
                            file: file,
                            preview: e.target.result,
                            url: e.target.result,
                            isExisting: false,
                            filename: file.name,
                            file_size: file.size,
                            mime_type: file.type
                        })
                    }
                    reader.readAsDataURL(file)
                })

                newImages.push(imageData)

                uploadProgress.value = ((i + 1) / files.length) * 100

            } catch (error) {
                console.error(`Error procesando ${file.name}:`, error)
                emit('upload-error', `${file.name}: ${error.message}`)
            }
        }

        images.value = [...images.value, ...newImages]


        uploading.value = false
        uploadProgress.value = 100

        emit('upload-complete', newImages)

        if (showError.value) {
            showError.value = false
        }

        if (fileInput.value) {
            fileInput.value.value = ''
        }

    } catch (error) {
        uploading.value = false
        uploadProgress.value = 0
        emit('upload-error', error.message)
        console.error('Error al procesar archivos:', error)

        if (fileInput.value) {
            fileInput.value.value = ''
        }
    }
}

const removeImage = (index) => {
    images.value.splice(index, 1)
}

const moveImage = (fromIndex, toIndex) => {
    const imagesCopy = [...images.value]
    const [movedImage] = imagesCopy.splice(fromIndex, 1)
    imagesCopy.splice(toIndex, 0, movedImage)
    images.value = imagesCopy
}

const clearAllImages = () => {
    images.value = []
    if (fileInput.value) {
        fileInput.value.value = ''
    }
}

watchEffect(() => {
    if (props.error) {
        showError.value = true
    }
})

defineExpose({
    clearAllImages,
    addImages: processFiles
})
</script>