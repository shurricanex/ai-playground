<template>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">PDF Bill Information Extractor</h1>
      
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <!-- Left Column: Input Section -->
        <div class="space-y-4 sm:space-y-6">
          <FileUpload @clear="cleanupFileUrl" />
          <PdfViewer v-if="selectedFile" />
          <ExtractorForm @submit="handleSubmit" />
        </div>

        <!-- Right Column: Results Section -->
        <div class="space-y-4 sm:space-y-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
          <ResultsDisplay />
        </div>
      </div>
    </div>
  </div>

  <ConfigModal />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useFileHandler } from '~/composables/useFileHandler'
import { useConfig } from '~/composables/useConfig'
import { useExtractor } from '~/composables/useExtractor'
import { useLocalStorage, STORAGE_KEYS } from '~/composables/useLocalStorage'

const { cleanupFileUrl, selectedFile } = useFileHandler()
const { systemPrompt, userPrompt, apiConfig, initializeConfig } = useConfig()
const { submitForm } = useExtractor()
const { setItem } = useLocalStorage()

// Watch for changes to save to localStorage
watch(systemPrompt, (newValue) => {
  setItem(STORAGE_KEYS.SYSTEM_PROMPT, newValue)
}, { deep: true })

watch(userPrompt, (newValue) => {
  setItem(STORAGE_KEYS.USER_PROMPT, newValue)
}, { deep: true })

watch(apiConfig, (newValue) => {
  setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(newValue))
}, { deep: true })

onMounted(() => {
  initializeConfig()
})

onUnmounted(() => {
  cleanupFileUrl()
})

const handleSubmit = () => {
  submitForm(selectedFile.value, systemPrompt.value, userPrompt.value, apiConfig.value)
}
</script>

<style>
textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Custom scrollbar styles */
.overflow-y-auto, .overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 transparent;
}

.overflow-y-auto::-webkit-scrollbar,
.overflow-x-auto::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track,
.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb,
.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #CBD5E1;
  border-radius: 3px;
}

@media (max-width: 640px) {
  .overflow-y-auto::-webkit-scrollbar,
  .overflow-x-auto::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
}
</style> 
