<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel :id="id" :required="required" v-if="label">{{ label }}</FormLabel>

        <div class="flex flex-col gap-3">
            <div @click="triggerFileInput" @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop"
                class="bg-light border-2 border-dashed  rounded-[5px] text-center cursor-pointer p-6">

                <div v-if="!fileName" class="space-y-2">
                    <Icon name="tabler:file-upload" class="mx-auto text-4xl text-dark" />
                    <p class="text-dark">
                        Haz clic aquí o arrastra un archivo
                    </p>
                    <p class="text-sm text-dark font-light">
                        Formatos admitidos: {{ acceptedTypes.join(', ').toUpperCase() }}
                    </p>
                </div>

                <div v-else class="flex flex-col items-center gap-2">
                    <div class="w-16 h-11 flex items-center justify-center rounded-lg">
                        <Icon name="tabler:paperclip" class="text-2xl text-primary" />
                    </div>

                    <div class="text-center">
                        <p class="text-dark font-medium">{{ fileName }}</p>
                    </div>

                    <button type="button" @click.stop="removeFile" class="text-error text-sm">
                        Eliminar archivo
                    </button>
                </div>
            </div>

            <input ref="fileInput" type="file" :accept="acceptAttribute" @change="handleFileSelect" class="hidden"
                :id="inputId" />

            <div v-if="uploading" class="w-full h-2 bg-gray-200 rounded-full">
                <div class="h-2 bg-primary rounded-full transition-all duration-300"
                    :style="{ width: uploadProgress + '%' }"></div>
            </div>
        </div>

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
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
        default: 100 * 1024 * 1024
    },
    acceptedTypes: {
        type: Array,
        default: () => ['pdf', 'doc', 'docx']
    }
})

const emit = defineEmits(['update:modelValue', 'upload-start', 'upload-complete', 'upload-error'])

const fileInput = ref(null)
const fileName = ref('')
const fileSize = ref('')
const fileType = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)
const showError = ref(false)

const inputId = computed(() => props.id)

const acceptAttribute = computed(() => {
    const mimeTypes = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain',
        zip: 'application/zip',
        html: 'text/html',
        htm: 'text/html'
    }
    return props.acceptedTypes.map(type => mimeTypes[type] || `.${type}`).join(',')
})

watch(() => props.modelValue, (newValue) => {
    if (newValue) {
        const segments = newValue.split('/')
        fileName.value = segments[segments.length - 1] || 'archivo'
        fileType.value = fileName.value.split('.').pop()?.toLowerCase() || ''
    } else {
        fileName.value = ''
        fileType.value = ''
    }
}, { immediate: true })

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const validateFile = (file) => {
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (!props.acceptedTypes.includes(extension)) {
        throw new Error(`Formato no permitido. Use: ${props.acceptedTypes.join(', ')}`)
    }

    if (file.size > props.maxSize) {
        throw new Error(`Archivo muy grande. Máximo: ${formatFileSize(props.maxSize)}`)
    }

    return true
}

const triggerFileInput = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
        processFile(file)
    }
}

const handleDrop = (event) => {
    const files = event.dataTransfer.files
    if (files.length > 0) {
        processFile(files[0])
    }
}

const processFile = async (file) => {
    try {
        validateFile(file)

        fileName.value = file.name
        fileSize.value = formatFileSize(file.size)
        fileType.value = file.name.split('.').pop()?.toLowerCase() || ''

        emit('upload-start', file)

        await simulateUpload(file)

        if (showError.value) {
            showError.value = false
        }

    } catch (error) {
        emit('upload-error', error.message)
        showError.value = true
    }
}

const simulateUpload = async (file) => {
    uploading.value = true
    uploadProgress.value = 0

    const interval = setInterval(() => {
        uploadProgress.value += 10
        if (uploadProgress.value >= 100) {
            clearInterval(interval)
            uploading.value = false

            const fileUrl = URL.createObjectURL(file)
            emit('update:modelValue', fileUrl)
            emit('upload-complete', fileUrl)
        }
    }, 100)
}

const removeFile = () => {
    fileName.value = ''
    fileSize.value = ''
    fileType.value = ''
    emit('update:modelValue', '')

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
    removeFile,
    triggerFileInput
})
</script>