<template>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">PDF Bill Information Extractor</h1>
      
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <!-- Left Column: Input Section -->
        <div class="space-y-4 sm:space-y-6">
          <!-- File Upload Section -->
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
                      @click="cleanupFileUrl"
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

          <!-- PDF Preview Section -->
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

          <!-- Prompts Section -->
          <div class="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 class="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Extraction Configuration</h2>
            
            <!-- System Prompt -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700">System Prompt</label>
                <div class="flex items-center space-x-2">
                  <span class="text-xs text-gray-400">(Optional)</span>
                  <button
                    @click="resetPrompts"
                    class="text-xs text-blue-600 hover:text-blue-800"
                    title="Reset prompts to default"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
              <textarea
                v-model="systemPrompt"
                :rows="isSystemPromptFocused ? 20 : 4"
                class="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                :class="{ 'max-h-[500px] overflow-y-auto': isSystemPromptFocused }"
                placeholder="Enter system instructions..."
                @focus="isSystemPromptFocused = true"
                @blur="isSystemPromptFocused = false"
              ></textarea>
            </div>

            <!-- User Prompt -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700">User Prompt</label>
                <span class="text-xs text-gray-400">(Optional)</span>
              </div>
              <textarea
                v-model="userPrompt"
                :rows="isUserPromptFocused ? 20 : 4"
                class="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                :class="{ 'max-h-[500px] overflow-y-auto': isUserPromptFocused }"
                placeholder="Enter extraction requirements..."
                @focus="isUserPromptFocused = true"
                @blur="isUserPromptFocused = false"
              ></textarea>
            </div>

            <!-- API Configuration -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700">Model Selection</label>
                <button
                  @click="showConfig = true"
                  class="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit API configuration"
                >
                  <Cog6ToothIcon class="h-5 w-5" />
                </button>
              </div>
              
              <!-- Model Selector -->
              <div class="space-y-2">
                <select
                  v-model="selectedModel"
                  @change="(e) => handleModelChange((e.target as HTMLSelectElement).value)"
                  class="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option v-for="model in AVAILABLE_MODELS" :key="model.id" :value="model.id">
                    {{ model.name }}
                  </option>
                </select>
                <p class="text-xs text-gray-500">
                  {{ currentModel?.description }}
                </p>
              </div>

              <!-- API Key Configuration -->
              <div v-if="needsApiKey" class="mt-2 text-xs text-red-500">
                API key required for {{ currentModel?.name }}
              </div>
              
              <div class="mt-2 text-xs text-gray-500">
                Temperature: {{ apiConfig.temperature }}, Top P: {{ apiConfig.top_p }}
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              @click="submitForm"
              :disabled="!selectedFile || loading"
              class="w-full mt-4 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <SpinnerIcon v-if="loading" class="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
              <span>{{ loading ? 'Processing...' : 'Extract Information' }}</span>
            </button>
          </div>
        </div>

        <!-- Right Column: Results Section -->
        <div class="space-y-4 sm:space-y-6 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto">
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
                    @click="copyResults"
                    class="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                    :title="copied ? 'Copied!' : 'Copy to clipboard'"
                  >
                    <component 
                      :is="copied ? CheckIcon : ClipboardIcon"
                      class="h-4 w-4"
                    />
                  </button>
                  <button
                    @click="downloadResults"
                    class="p-1.5 rounded-md bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
                    title="Download JSON"
                  >
                    <ArrowDownTrayIcon class="h-4 w-4" />
                  </button>
                  <div class="flex space-x-1">
                    <button
                      @click="downloadExcel"
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
        </div>
      </div>
    </div>
  </div>

  <!-- Config Modal -->
  <Teleport to="body">
    <div v-if="showConfig" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-lg max-w-lg w-full p-4 sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">API Configuration</h3>
          <button @click="showConfig = false" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="mb-4">
          <textarea
            v-model="configText"
            rows="12"
            class="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :placeholder="configPlaceholder"
            :class="{ 'border-red-500': configError }"
          ></textarea>
          <div class="mt-2 text-xs space-y-1">
            <p v-if="configError" class="text-red-500">{{ configError }}</p>
            <p class="text-gray-500">Tip: Remove any property or set to null to use API defaults</p>
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="resetConfig"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            title="Reset configuration to default values"
          >
            Reset Config
          </button>
          <button
            @click="saveConfig"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- API Key Modal -->
    <div v-if="showKeyInput" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-lg max-w-lg w-full p-4 sm:p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Configure API Key</h3>
          <button @click="showKeyInput = false" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ currentModel?.provider === 'google' ? 'Upload Service Account JSON' : `Enter API Key for ${currentModel?.name}` }}
          </label>
          <input
            v-if="apiKeyInputType === 'password'"
            v-model="tempApiKey"
            type="password"
            class="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your API key"
          />
          <input
            v-else
            type="file"
            accept="application/json"
            class="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            @change="(e) => tempApiKey = (e.target as HTMLInputElement).value"
          />
          <p class="mt-2 text-xs text-gray-500">
            {{ currentModel?.provider === 'google' 
              ? 'Upload your Google Cloud service account JSON file' 
              : 'Your API key will be stored securely in your browser\'s local storage.' }}
          </p>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="showKeyInput = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            @click="saveApiKey"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            :disabled="!tempApiKey"
          >
            Save {{ currentModel?.provider === 'google' ? 'Service Account' : 'API Key' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, defineAsyncComponent, onMounted, watch } from 'vue'
import { 
  DocumentIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon, 
  ArrowDownTrayIcon,
  ClipboardIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  TableCellsIcon
} from '@heroicons/vue/24/outline'
import SpinnerIcon from '~/components/SpinnerIcon.vue'
import * as XLSX from 'xlsx'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

interface PDFFileMetadata {
  name: string;
  size: number;
  lastModified: number;
  type: string;
  url?: string;
}

interface ContainerDetail {
  container_number: string;
  container_seal_number: string;
  container_size_type: string;
  carton_amount: number;
}

interface FreightRateItem {
  item_name: string;
  amount: string;
  currency: string;
}

interface BillInfo {
  bl_number: string;
  total_cartons: number;
  container_detail: ContainerDetail[];
  hts_code: string;
  is_port_of_arrival_door: boolean;
  place_of_delivery: string;
  port_of_discharge: string;
  port_of_loading: string;
  freight_payment_type: string;
  freight_rate_item: FreightRateItem[];
  service_contract_number: string;
  shipped_on_board_date: string;
  freight_charge_total: number;
  freight_charge_currency: string;
  total_measurement: number;
  total_shipment_weight: number;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: 'deepseek' | 'google' | 'anthropic';
  requiresKey?: boolean;
  apiEndpoint?: string;
  description: string;
}

const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'deepseek-chat',
    name: 'deepseek-chat(V3)',
    provider: 'deepseek',
    apiEndpoint: 'https://api.deepseek.com/chat/completions',
    description: 'DeepSeek\'s general-purpose chat model'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    provider: 'google',
    requiresKey: false,
    description: 'Google\'s fastest and most capable model for document processing'
  }
]

const DEFAULT_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  temperature: 0,
  top_p: 1,
  max_tokens: 4000
}

const STORAGE_KEYS = {
  SYSTEM_PROMPT: 'bill-extractor-system-prompt',
  USER_PROMPT: 'bill-extractor-user-prompt',
  API_CONFIG: 'bill-extractor-api-config',
  PDF_FILE: 'bill-extractor-pdf-file',
  MODEL_KEYS: 'bill-extractor-model-keys'
}

const DEFAULT_PROMPTS = {
  SYSTEM: `You are an advanced document reasoning assistant. Your task is to extract and analyze data from complex tables accurately and reasoning step by step, even when they contain blank spaces, ambiguous formatting, or overlapping information. Focus on correctly associating values with their respective columns.

Here is a table with freight information. Each row belongs to a shipment, and the columns are PREPAID (amount prepaid by the sender) and COLLECT (amount to be collected from the receiver). If a cell under a column is blank, it means the value does not exist for that column for that shipment.

Table Example 1:

ITEM 	                         PREPAID	       COLLECT
LUMSUM                        USD 50.00
OCEAN FREIGHT                                         USD 75.00
LTHC                               VND 30.00
DOC O/B DOC FEE                                       VND 60.00

result of example 1 :
[
 { "ITEM": "LUMSUM", "PREPAID": null, "COLLECT": "50.00", "CURRENCY": "USD" },
 { "ITEM": "OCEAN FREIGHT", "PREPAID": null, "COLLECT": "75.00", "CURRENCY": "USD"},
 { "ITEM": "LTHC", "PREPAID": "30.00", "COLLECT": null, "CURRENCY": "VND"},
 { "ITE ID": "DOC O/B DOC FEE", "PREPAID": "60.00", "COLLECT": null, "CURRENCY":"VND"}
]

Table Example 2: 
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|Freight & Charge    |  Rate                 |  Unit                         |  Currency                  | Prepaid                    | Collect                    |
|item name 1           |            999.00   | Per Container         |  USD                          |                                   |             1011.00     | 
|item name 2           |           222.00    | Per Document Fee |  CNY                         |                   335.00    |                                 |
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

result of example 2:
[
 { "ITEM": "item name 1", "PREPAID": null, "COLLECT":  "1011.00", "CURRENCY": "USD" },
 { "ITEM": "item name 2", "PREPAID": "335.00", "COLLECT":  null, "CURRENCY": "CNY"},
]

Table Example 3: 
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|     FREIGHT & CHARGES     |          BASIS                  |         RATE                   |          PREPAID                    |      COLLECT        |
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|   Item 1                                  |         1                            | USD           2,992.00   |                                              | USD      2,992.00 |
|   Item 2                                  |         1                            | CNY             340.00    |  CNY                 340,00       |                               |
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

result of example 3:
[
 { "ITEM": "item 1", "PREPAID": null, "COLLECT": "2,992.00", "CURRENCY": "USD" },
 { "ITEM": "item 2", "PREPAID": "340.00", "COLLECT": null, "CURRENCY": "CNY"},
]

Table of example 4:
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|CODE   TARIFF ITEM           |       FREIGHTED AS                 |       RATE           |           PREPAID           |               COLLECT      |
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
|ITEM 1                                  |  1/400HQ                                 |   1173.00           |                                      | USD        1173.00      |
|ITEM 2                                  |  2.000                                       |    120.00            | CNY  240.00               |                                      |
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
result of example 4:
[
 { "ITEM": "ITEM 1", "PREPAID": null, "COLLECT": "1173.00", "CURRENCY": "USD" },
 { "ITEM": "ITEM 2", "PREPAID": "240.00", "COLLECT": null, "CURRENCY": "CNY"},
]


Instructions:
1.	Convert tabular data line items into markdown fill the blank cell with null and display 
2.	Avoid Confusion: Do not misinterpret blank cells. Always associate each value with its correct column and do not mix up columns, even if there is an unusual pattern of blanks.
3.	Output Format: Provide the extracted as data as schema below
{"ITEM": null, "PREPAID": null;, "COLLECT":null, "CURRENCY":null }
4.	Validation: 
    validation1: Cross-check each value with its respective column to ensure accuracy, especially for rows with blank spaces.
	validation2: also make sure either PREPAID or COLLECT has value.
    validation3: ensure strictly that not all PREPAID cells are null, and also not all COLLECT cells are null, that mean the PREPAID and COLLECT column must not be entirely null, if this fails then it mean you have mixed up column value .
5. find the freight payment type which can be COLLECT or PREPAID, then use it to filter the results, for example the freight payment type is COLLECT then filter to include object which COLLECT is not null.
6. map the result into {"item", null, "amount": null, "currency":null}.
7.  extract other field values as follow schema and add the previous filtered and mapped results as freight_rate_item property in this schema.
JSON schema:
{
 "bl_number": null,
 "total_cartons": 0,
"container_detail":[{
"container_number": null,
"container_seal_number": null,
"container_size_type": null,
"carton_amount":0,
}
]
 "hts_code": null,
 "is_port_of_arrival_door": false,
 "place_of_delivery": null,
 "port_of_discharge": null,
 "port_of_loading": null,
 "freight_payment_type": null,
 "service_contract_number": null,
 "shipped_on_board_date": null,
 "freight_charge_total": 0,
 "freight_charge_currency": "",
 "total_measurement": 0,
 "total_shipment_weight": 0
}
`, // Your long default user prompt
USER: `Please extract the information from the freight charge table in the document provided`
}

const useLocalStorage = () => {
  const getItem = (key: string, defaultValue: any = null) => {
    if (process.client) {
      return localStorage.getItem(key) ?? defaultValue
    }
    return defaultValue
  }

  const setItem = (key: string, value: string) => {
    if (process.client) {
      localStorage.setItem(key, value)
    }
  }

  return { getItem, setItem }
}

const { getItem, setItem } = useLocalStorage()

const fileInput = ref(null)
const selectedFile = ref<File | null>(null)
const systemPrompt = ref(DEFAULT_PROMPTS.SYSTEM)
const userPrompt = ref(DEFAULT_PROMPTS.USER)
const result = ref('')
const error = ref('')
const loading = ref(false)
const copied = ref(false)
const showConfig = ref(false)
const configText = ref(JSON.stringify(DEFAULT_CONFIG, null, 2))
const apiConfig = ref(DEFAULT_CONFIG)
const configError = ref('')
const showPdf = ref(true)
const currentPage = ref(1)
const pdfUrl = ref<string | null>(null)
const isSystemPromptFocused = ref(false)
const isUserPromptFocused = ref(false)
const zoomLevel = ref(1)
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const displayMode = ref<'json' | 'markdown'>('json')
const extractionDuration = ref<number | null>(null)
const selectedModel = ref<string>(DEFAULT_CONFIG.model)
const modelKeys = ref<Record<string, string>>({})
const showKeyInput = ref(false)
const tempApiKey = ref('')
const selectedProvider = ref<string>('')

const VuePdfEmbed = defineAsyncComponent(() => 
  import('vue-pdf-embed')
)

const configPlaceholder = computed(() => {
  const model = currentModel.value
  if (!model) return ''

  let examples = ''
  
  if (model.provider === 'deepseek') {
    examples = `// Sample Configurations:

// 1. More Creative Output
{
  "model": "${selectedModel.value}",
  "temperature": 0.8,
  "top_p": 0.9,
  "__comments": {
    "description": "Higher temperature for more varied outputs"
  }
}

// 2. More Precise Output
{
  "model": "${selectedModel.value}",
  "temperature": 0.3,
  "top_p": 0.5,
  "__comments": {
    "description": "Lower temperature for more focused outputs"
  }
}

// 3. Longer Output
{
  "model": "${selectedModel.value}",
  "temperature": 0.7,
  "max_tokens": 8000,
  "__comments": {
    "description": "Increased token limit for longer responses"
  }
}`
  } else if (model.provider === 'google') {
    examples = `// Sample Configurations:

// 1. Standard Output
{
  "model": "${selectedModel.value}",
  "temperature": 0.4,
  "candidateCount": 1,
  "__comments": {
    "description": "Balanced between creativity and precision"
  }
}

// 2. More Precise Output
{
  "model": "${selectedModel.value}",
  "temperature": 0.1,
  "topK": 1,
  "topP": 0.8,
  "__comments": {
    "description": "More focused and deterministic outputs"
  }
}

// 3. Safety Settings
{
  "model": "${selectedModel.value}",
  "temperature": 0.4,
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
  ],
  "__comments": {
    "description": "With additional safety controls"
  }
}`
  }

  return `${examples}

// Default Configuration:
${JSON.stringify({ ...DEFAULT_CONFIG, model: selectedModel.value }, null, 2)}`
})

const formattedResult = computed(() => {
  if (!result.value) return ''
  try {
    const parsed = JSON.parse(result.value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return result.value
  }
})

const markdownResult = computed(() => {
  if (!result.value) return ''
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(result.value)
    // Convert JSON to markdown
    let markdown = '# Bill Information\n\n'
    
    // Add main bill information
    markdown += '## General Information\n\n'
    markdown += `- **Bill of Lading Number:** ${parsed.bl_number || 'N/A'}\n`
    markdown += `- **Total Cartons:** ${parsed.total_cartons || 'N/A'}\n`
    markdown += `- **HTS Code:** ${parsed.hts_code || 'N/A'}\n`
    markdown += `- **Place of Delivery:** ${parsed.place_of_delivery || 'N/A'}\n`
    markdown += `- **Port of Discharge:** ${parsed.port_of_discharge || 'N/A'}\n`
    markdown += `- **Port of Loading:** ${parsed.port_of_loading || 'N/A'}\n`
    markdown += `- **Freight Payment Type:** ${parsed.freight_payment_type || 'N/A'}\n`
    markdown += `- **Service Contract Number:** ${parsed.service_contract_number || 'N/A'}\n`
    markdown += `- **Shipped on Board Date:** ${parsed.shipped_on_board_date || 'N/A'}\n`
    markdown += `- **Total Measurement:** ${parsed.total_measurement || 'N/A'}\n`
    markdown += `- **Total Shipment Weight:** ${parsed.total_shipment_weight || 'N/A'}\n\n`

    // Add container details
    if (parsed.container_detail && parsed.container_detail.length > 0) {
      markdown += '## Container Details\n\n'
      parsed.container_detail.forEach((container: any, index: number) => {
        markdown += `### Container ${index + 1}\n\n`
        markdown += `- **Container Number:** ${container.container_number || 'N/A'}\n`
        markdown += `- **Seal Number:** ${container.container_seal_number || 'N/A'}\n`
        markdown += `- **Size/Type:** ${container.container_size_type || 'N/A'}\n`
        markdown += `- **Carton Amount:** ${container.carton_amount || 'N/A'}\n\n`
      })
    }

    // Add freight rate items
    if (parsed.freight_rate_item && parsed.freight_rate_item.length > 0) {
      markdown += '## Freight Rate Items\n\n'
      markdown += '| Item Name | Amount | Currency |\n'
      markdown += '|-----------|---------|----------|\n'
      parsed.freight_rate_item.forEach((item: any) => {
        markdown += `| ${item.item_name || 'N/A'} | ${item.amount || 'N/A'} | ${item.currency || 'N/A'} |\n`
      })
      markdown += '\n'
    }

    return md.render(markdown)
  } catch {
    // If not valid JSON, render the raw text as markdown
    return md.render(result.value)
  }
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file?.type === 'application/pdf') {
    selectedFile.value = file;
    error.value = '';
    result.value = '';
    currentPage.value = 1;
    
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    
    const fileUrl = URL.createObjectURL(file);
    pdfUrl.value = fileUrl;
    
    // Save file metadata to localStorage
    const fileMetadata: PDFFileMetadata = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      type: file.type
    };
    
    if (process.client) {
      setItem(STORAGE_KEYS.PDF_FILE, JSON.stringify(fileMetadata));
    }
  } else {
    error.value = 'Please select a PDF file';
  }
}

const handleFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  
  if (file?.type === 'application/pdf') {
    selectedFile.value = file;
    error.value = '';
    result.value = '';
    currentPage.value = 1;
    
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
    }
    
    const fileUrl = URL.createObjectURL(file);
    pdfUrl.value = fileUrl;
    
    // Save file metadata to localStorage
    const fileMetadata: PDFFileMetadata = {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      type: file.type,
      url: fileUrl
    };
    
    if (process.client) {
      setItem(STORAGE_KEYS.PDF_FILE, JSON.stringify(fileMetadata));
    }
  } else {
    error.value = 'Please drop a PDF file';
  }
}

const submitForm = async () => {
  if (!selectedFile.value || !currentModel.value) return
  if (needsApiKey.value && currentModel.value.provider !== 'google') {
    error.value = 'Please configure API key first'
    showKeyInput.value = true
    return
  }

  loading.value = true
  error.value = ''
  result.value = ''
  extractionDuration.value = null
  const startTime = performance.now()

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('systemPrompt', systemPrompt.value)
    formData.append('userPrompt', userPrompt.value)
    formData.append('model', selectedModel.value)
    formData.append('provider', currentModel.value.provider)
    
    // Only append API key for providers that need it (not Google)
    if (currentModel.value.requiresKey && currentModel.value.provider !== 'google') {
      formData.append('apiKey', modelKeys.value[currentModel.value.provider])
    }

    const cleanConfig = Object.entries(apiConfig.value)
      .reduce<Record<string, any>>((acc, [key, value]) => {
        if (value !== null) {
          acc[key] = value
        }
        return acc
      }, {})

    formData.append('config', JSON.stringify(cleanConfig))

    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to process PDF')
    }

    const data = await response.json()
    result.value = data.result
    extractionDuration.value = (performance.now() - startTime) / 1000
  } catch (err: any) {
    error.value = err?.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const downloadResults = () => {
  if (!result.value) return
  
  const blob = new Blob([result.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bill-info-${new Date().toISOString()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const copyResults = async () => {
  if (!result.value) return
  
  try {
    await navigator.clipboard.writeText(result.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    error.value = 'Failed to copy to clipboard'
  }
}

const resetConfig = () => {
  apiConfig.value = { ...DEFAULT_CONFIG }
  configText.value = JSON.stringify(DEFAULT_CONFIG, null, 2)
  configError.value = ''
  setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(DEFAULT_CONFIG))
}

const saveConfig = () => {
  try {
    const parsed = JSON.parse(configText.value)
    const { __comments, ...configWithoutComments } = parsed
    apiConfig.value = configWithoutComments
    showConfig.value = false
    configError.value = ''
  } catch (err) {
    configError.value = 'Invalid JSON format'
  }
}

const togglePdfView = () => {
  showPdf.value = !showPdf.value
}

const resetPrompts = () => {
  const confirmReset = window.confirm('Are you sure you want to reset prompts to default values?')
  if (confirmReset) {
    systemPrompt.value = DEFAULT_PROMPTS.SYSTEM
    userPrompt.value = DEFAULT_PROMPTS.USER
    setItem(STORAGE_KEYS.SYSTEM_PROMPT, DEFAULT_PROMPTS.SYSTEM)
    setItem(STORAGE_KEYS.USER_PROMPT, DEFAULT_PROMPTS.USER)
  }
}

const zoomIn = () => {
  if (zoomLevel.value < MAX_ZOOM) {
    zoomLevel.value = Math.min(zoomLevel.value + 0.25, MAX_ZOOM)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > MIN_ZOOM) {
    zoomLevel.value = Math.max(zoomLevel.value - 0.25, MIN_ZOOM)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

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
  // Initialize config from localStorage
  const savedConfig = getItem(STORAGE_KEYS.API_CONFIG)
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig)
      apiConfig.value = parsed
      configText.value = JSON.stringify(parsed, null, 2)
    } catch {
      apiConfig.value = DEFAULT_CONFIG
      configText.value = JSON.stringify(DEFAULT_CONFIG, null, 2)
    }
  }

  // Initialize prompts from localStorage
  const savedSystemPrompt = getItem(STORAGE_KEYS.SYSTEM_PROMPT)
  const savedUserPrompt = getItem(STORAGE_KEYS.USER_PROMPT)
  
  if (savedSystemPrompt) {
    systemPrompt.value = savedSystemPrompt
  }
  if (savedUserPrompt) {
    userPrompt.value = savedUserPrompt
  }

  // Remove PDF restoration from localStorage since we can't restore the actual file
  const savedFile = getItem(STORAGE_KEYS.PDF_FILE);
  if (savedFile) {
    try {
      // Just clear the saved file data since we can't restore the actual file
      localStorage.removeItem(STORAGE_KEYS.PDF_FILE);
    } catch {
      // Ignore errors
    }
  }

  // Load saved model keys
  const savedModelKeys = getItem(STORAGE_KEYS.MODEL_KEYS)
  if (savedModelKeys) {
    try {
      modelKeys.value = JSON.parse(savedModelKeys)
    } catch {
      modelKeys.value = {}
    }
  }
})

onUnmounted(() => {
  cleanupFileUrl();
})

// Add a clear file button in the template

// Add cleanup function for file URL
const cleanupFileUrl = () => {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
    pdfUrl.value = null;
  }
  selectedFile.value = null;
  if (process.client) {
    localStorage.removeItem(STORAGE_KEYS.PDF_FILE);
  }
}

// Add function to extract JSON from result text
const extractJsonFromResult = (text: string): string | null => {
  try {
    // Look for content between ```json and ``` tags
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim()
    }
    
    // If no json tags found, try to find any JSON object in the text
    const matches = text.match(/\{[\s\S]*\}/)
    if (matches) {
      return matches[0]
    }
    
    return null
  } catch {
    return null
  }
}

// Update jsonToExcel function to avoid repeating BL number
const jsonToExcel = (jsonData: string): Uint8Array => {
  try {
    // Extract JSON from the result text
    const extractedJson = extractJsonFromResult(jsonData)
    if (!extractedJson) {
      throw new Error('No valid JSON found in the result')
    }

    const data: BillInfo = JSON.parse(extractedJson)
    const wb = XLSX.utils.book_new()

    // Define all possible columns
    const headers = [
      'Bill of Lading Number', 'Total Cartons', 'HTS Code', 'Place of Delivery',
      'Port of Discharge', 'Port of Loading', 'Freight Payment Type',
      'Service Contract Number', 'Shipped on Board Date', 'Freight Charge Total',
      'Freight Charge Currency', 'Total Measurement', 'Total Shipment Weight',
      'Container Number', 'Container Seal Number', 'Container Size Type', 'Container Carton Amount',
      'Freight Item Name', 'Freight Amount', 'Freight Currency'
    ]

    // Create rows array starting with headers
    const rows = [headers]

    // Add main row with general information
    const mainRow = [
      data.bl_number,
      data.total_cartons?.toString(),
      data.hts_code,
      data.place_of_delivery,
      data.port_of_discharge,
      data.port_of_loading,
      data.freight_payment_type,
      data.service_contract_number,
      data.shipped_on_board_date,
      data.freight_charge_total?.toString(),
      data.freight_charge_currency,
      data.total_measurement.toString(),
      data.total_shipment_weight.toString(),
      '', '', '', '', '', '', '' // Empty cells for container and freight details
    ]
    rows.push(mainRow)

    // Add container details rows
    if (data.container_detail && data.container_detail.length > 0) {
      data.container_detail.forEach(container => {
        rows.push([
          '', // Empty cell for BL number
          '', '', '', '', '', '', '', '', '', '', '', '', // Empty cells for general info
          container.container_number,
          container.container_seal_number,
          container.container_size_type,
          container.carton_amount.toString(),
          '', '', '' // Empty cells for freight details
        ])
      })
    }

    // Add freight rate rows
    if (data.freight_rate_item && data.freight_rate_item.length > 0) {
      data.freight_rate_item.forEach(item => {
        rows.push([
          '', // Empty cell for BL number
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // Empty cells for general info and container details
          item.item_name,
          item.amount,
          item.currency
        ])
      })
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows)
    
    // Calculate column widths based on content
    const colWidths = headers.map((header, index) => {
      // Start with header width
      let maxWidth = header.length

      // Check all rows for this column
      rows.forEach(row => {
        const cellContent = row[index]?.toString() || ''
        maxWidth = Math.max(maxWidth, cellContent.length)
      })

      // Add some padding and convert to character width
      return { wch: maxWidth + 2 }
    })
    
    ws['!cols'] = colWidths

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Bill Information')

    return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  } catch (err) {
    console.error('Error converting JSON to Excel:', err)
    throw new Error('Failed to convert JSON to Excel')
  }
}

// Update download Excel function
const downloadExcel = () => {
  if (!result.value) return

  try {
    const excelBuffer = jsonToExcel(result.value)
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bill-info-${new Date().toISOString()}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    error.value = 'Failed to download Excel file'
  }
}

const currentModel = computed(() => 
  AVAILABLE_MODELS.find(model => model.id === selectedModel.value)
)

const needsApiKey = computed(() => 
  currentModel.value?.requiresKey && 
  currentModel.value.provider !== 'google' && 
  !modelKeys.value[currentModel.value.provider]
)

const handleModelChange = (modelId: string) => {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId)
  if (!model) return
  
  selectedModel.value = modelId
  selectedProvider.value = model.provider
  
  // Update both apiConfig and configText with the new model
  const newConfig = {
    ...apiConfig.value,
    model: modelId
  }
  apiConfig.value = newConfig
  configText.value = JSON.stringify(newConfig, null, 2)
  
  // Only show API key modal for non-Google providers that require a key
  if (model.requiresKey && model.provider !== 'google' && !modelKeys.value[model.provider]) {
    showKeyInput.value = true
  }
}

const apiKeyInputType = computed(() => 
  currentModel.value?.provider === 'google' ? 'file' : 'password'
)

const saveApiKey = async () => {
  if (!selectedProvider.value || !tempApiKey.value) return
  
  let finalKey = tempApiKey.value
  
  // If it's Google provider, read the JSON file
  if (selectedProvider.value === 'google' && apiKeyInputType.value === 'file') {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (!fileInput?.files?.length) return
    
    try {
      const file = fileInput.files[0]
      const text = await file.text()
      finalKey = text // Store the entire service account JSON
    } catch (err) {
      error.value = 'Failed to read service account JSON file'
      return
    }
  }
  
  modelKeys.value = {
    ...modelKeys.value,
    [selectedProvider.value]: finalKey
  }
  
  setItem(STORAGE_KEYS.MODEL_KEYS, JSON.stringify(modelKeys.value))
  showKeyInput.value = false
  tempApiKey.value = ''
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

/* Markdown content styles */
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
