<template>
  <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6">
    <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Upload Document</h2>
    <div 
      class="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
      @dragover.prevent
      @drop.prevent="handleFileDrop"
      @click="$refs.fileInput.click()"
    >
      <input 
        ref="fileInput"
        type="file" 
        accept=".pdf"
        class="hidden"
        @change="handleFileChange"
      >
      <div v-if="!selectedFile" class="space-y-2">
        <DocumentIcon class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
        <div>
          <p class="text-sm sm:text-base text-gray-600">
            Drag and drop a PDF file here, or click to select
          </p>
          <p class="text-xs sm:text-sm text-gray-500 mt-1">PDF files only</p>
        </div>
      </div>
      <div v-else class="space-y-2">
        <DocumentTextIcon class="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />
        <div>
          <div class="flex items-center justify-center space-x-2">
            <p class="text-sm sm:text-base text-gray-900 font-medium">{{ selectedFile.name }}</p>
            <button
              @click.stop="$emit('clear')"
              class="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove file"
            >
              <XMarkIcon class="h-4 w-4" />
            </button>
          </div>
          <p class="text-xs sm:text-sm text-gray-500">
            {{ formatFileSize(selectedFile.size) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DocumentIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { useFileHandler } from '~/composables/useFileHandler'

const { selectedFile, formatFileSize, handleFileChange, handleFileDrop } = useFileHandler()

defineEmits<{
  (e: 'clear'): void
}>()
</script> 
