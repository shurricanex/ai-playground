<template>
  <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6">
    <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Results</h2>
    
    <!-- Error Message -->
    <div v-if="error" class="mb-4 p-3 sm:p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
      <div class="flex items-center space-x-2">
        <ExclamationCircleIcon class="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
        <span class="text-sm sm:text-base">{{ error }}</span>
      </div>
    </div>

    <!-- Results Display -->
    <div v-if="result" class="space-y-4">
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center space-x-2">
          <button
            @click="displayMode = 'json'"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="displayMode === 'json' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'"
          >
            JSON
          </button>
          <button
            @click="displayMode = 'markdown'"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="displayMode === 'markdown' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'"
          >
            Markdown
          </button>
        </div>
        <div v-if="extractionDuration !== null" class="text-sm text-gray-500">
          Extracted in {{ extractionDuration.toFixed(2) }}s
        </div>
      </div>
      <div class="relative">
        <div v-if="displayMode === 'json'" class="bg-gray-50 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm whitespace-pre-wrap max-h-[60vh] xl:max-h-[calc(100vh-20rem)] overflow-y-auto">
          <pre>{{ formattedResult }}</pre>
        </div>
        <div v-else class="prose prose-sm max-w-none bg-gray-50 p-3 sm:p-4 rounded-lg overflow-x-auto max-h-[60vh] xl:max-h-[calc(100vh-20rem)] overflow-y-auto">
          <div v-html="markdownResult"></div>
        </div>
        <div class="absolute top-2 right-2 flex space-x-2">
          <button
            @click="copyResults(result)"
            class="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
            :title="copied ? 'Copied!' : 'Copy to clipboard'"
          >
            <component 
              :is="copied ? CheckIcon : ClipboardIcon"
              class="h-4 w-4"
            />
          </button>
          <button
            @click="downloadResults(result)"
            class="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
            title="Download JSON"
          >
            <ArrowDownTrayIcon class="h-4 w-4" />
          </button>
          <div class="flex space-x-1">
            <button
              @click="downloadExcel(result)"
              class="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors group relative"
              title="Download Excel"
            >
              <TableCellsIcon class="h-4 w-4" />
              <span class="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Download Excel
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Placeholder when no results -->
    <div v-if="!result && !error" class="space-y-4">
      <div class="bg-gray-50 rounded-lg p-6 text-center">
        <MagnifyingGlassIcon class="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 class="text-sm sm:text-base font-medium text-gray-900 mb-1">No Results Yet</h3>
        <p class="text-xs sm:text-sm text-gray-500">
          Upload a PDF file and configure extraction settings to see results here
        </p>
      </div>
      <!-- Sample Result Structure -->
      <div class="border border-gray-200 rounded-lg p-4">
        <h4 class="text-xs font-medium text-gray-500 uppercase mb-3">Sample Result Structure</h4>
        <pre class="text-xs text-gray-400 overflow-x-auto">
{
  "bl_number": "...",
  "total_cartons": "...",
  "container_size_type": "...",
  "freight_payment_type": "...",
  "freight_rate_item": [
    {
      "item_name": "...",
      "amount": "...",
      "currency": "..."
    }
  ],
  // ... other fields
}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ExclamationCircleIcon,
  ArrowDownTrayIcon,
  ClipboardIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  TableCellsIcon
} from '@heroicons/vue/24/outline'
import { useExtractor } from '~/composables/useExtractor'
import { useExport } from '~/composables/useExport'

const {
  error,
  result,
  extractionDuration,
  displayMode,
  formattedResult,
  markdownResult
} = useExtractor()

const {
  copied,
  downloadResults,
  copyResults,
  downloadExcel
} = useExport()
</script>

<style>
.prose {
  @apply text-gray-800;
}

.prose h1 {
  @apply text-2xl font-bold text-gray-900 mb-6;
}

.prose h2 {
  @apply text-xl font-semibold text-gray-800 mt-8 mb-4;
}

.prose h3 {
  @apply text-lg font-medium text-gray-800 mt-6 mb-3;
}

.prose table {
  @apply w-full border-collapse my-4;
}

.prose table th {
  @apply bg-gray-100 text-left p-2 border border-gray-300;
}

.prose table td {
  @apply p-2 border border-gray-300;
}

.prose ul {
  @apply list-disc list-inside;
}

.prose li {
  @apply my-1;
}

.prose strong {
  @apply text-gray-900;
}

.prose p {
  @apply my-2;
}
</style> 
