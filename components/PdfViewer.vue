<template>
  <div v-if="selectedFile" class="bg-white rounded-xl shadow-sm p-4 sm:p-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg sm:text-xl font-semibold text-gray-800">Document Preview</h2>
      <button
        @click="togglePdfView"
        class="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
      >
        <component 
          :is="showPdf ? 'EyeSlashIcon' : 'EyeIcon'"
          class="h-4 w-4"
        />
        <span>{{ showPdf ? 'Hide Preview' : 'Show Preview' }}</span>
      </button>
    </div>
    
    <div v-if="showPdf" class="border rounded-lg">
      <div class="relative bg-gray-100 rounded-lg group" style="height: 600px;">
        <div class="absolute top-4 right-4 flex items-center space-x-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm border transition-opacity duration-200 opacity-0 group-hover:opacity-100">
          <button
            @click="zoomOut"
            :disabled="zoomLevel <= MIN_ZOOM"
            class="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
            title="Zoom out"
          >
            <MinusIcon class="h-4 w-4" />
          </button>
          <button
            @click="resetZoom"
            class="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900"
            title="Reset zoom"
          >
            {{ Math.round(zoomLevel * 100) }}%
          </button>
          <button
            @click="zoomIn"
            :disabled="zoomLevel >= MAX_ZOOM"
            class="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
            title="Zoom in"
          >
            <PlusIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="h-full overflow-auto">
          <div :style="`transform: scale(${zoomLevel}); transform-origin: top left; transition: transform 0.2s`">
            <ClientOnly>
              <VuePdfEmbed
                v-if="pdfUrl"
                :source="pdfUrl"
                :page="currentPage"
                class="rounded-lg"
              />
            </ClientOnly>
          </div>
        </div>

        <div 
          class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white/90 px-3 py-1.5 rounded-full shadow-sm border transition-opacity duration-200 opacity-0 group-hover:opacity-100"
        >
          <button
            @click="currentPage > 1 && currentPage--"
            :disabled="currentPage <= 1"
            class="p-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
          >
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <span class="text-sm text-gray-600 min-w-[4rem] text-center">
            Page {{ currentPage }}
          </span>
          <button
            @click="currentPage++"
            class="p-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronRightIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/vue/24/outline'
import { usePdfViewer } from '~/composables/usePdfViewer'
import { useFileHandler } from '~/composables/useFileHandler'

const { selectedFile, pdfUrl } = useFileHandler()
const {
  showPdf,
  currentPage,
  zoomLevel,
  MIN_ZOOM,
  MAX_ZOOM,
  VuePdfEmbed,
  togglePdfView,
  zoomIn,
  zoomOut,
  resetZoom
} = usePdfViewer()
</script> 
