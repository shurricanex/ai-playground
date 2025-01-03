<template>
  <div class="min-h-screen bg-gray-50 py-4 sm:py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  <p class="text-sm sm:text-base text-gray-900 font-medium">{{ selectedFile.name }}</p>
                  <p class="text-xs sm:text-sm text-gray-500">
                    {{ formatFileSize(selectedFile.size) }}
                  </p>
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
                <span class="text-xs text-gray-400">(Optional)</span>
              </div>
              <textarea
                v-model="systemPrompt"
                rows="4"
                class="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter system instructions..."
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
                rows="4"
                class="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter extraction requirements..."
              ></textarea>
            </div>

            <!-- API Configuration -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700">API Configuration</label>
                <button
                  @click="showConfig = true"
                  class="text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit API configuration"
                >
                  <Cog6ToothIcon class="h-5 w-5" />
                </button>
              </div>
              <div class="text-xs text-gray-500">
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
              <div class="relative">
                <pre class="bg-gray-50 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm whitespace-pre-wrap max-h-[60vh] xl:max-h-[calc(100vh-20rem)] overflow-y-auto">{{ formattedResult }}</pre>
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
                    title="Download results"
                  >
                    <ArrowDownTrayIcon class="h-4 w-4" />
                  </button>
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
          >
            Reset to Default
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
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  DocumentIcon, 
  DocumentTextIcon, 
  ExclamationCircleIcon, 
  ArrowDownTrayIcon,
  ClipboardIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import SpinnerIcon from '~/components/SpinnerIcon.vue'

const DEFAULT_CONFIG = {
  temperature: 0,
  top_p: 1,
  max_tokens: null,
  presence_penalty: null,
  frequency_penalty: null}

const fileInput = ref(null)
const selectedFile = ref(null)
const systemPrompt = ref(`You are a document entity extraction specialist, receiving various waybills. Your objective is to:

1. **Adhere to the JSON Schema**  
  - The output **must** match the structure below exactly.  
  - If an entity is missing or cannot be found in the document, set its value to null (or an appropriate default like 0 for numbers, false for booleans).

2. **Extract Entities Only from the Document**  
  - Do not invent values or rely on external knowledge.  
  - Each extracted value must appear verbatim in the source document (except for minor formatting like trimming whitespace or converting dates).

3. **Tabular Data Extraction**  
  - Focus on the table (or tables) that list freight charges.  
  - Each row can only have **one** of the following payment types: "COLLECT" or "PREPAID" value. 
  - The waybill has a **single** freight_payment_type overall. If the waybill states "COLLECT", only include line items marked or implied as **COLLECT**. If it states "PREPAID", only include items marked or implied as **PREPAID**.  
  - Exclude any rows or items that do **not** match the established freight_payment_type.  
  - Here is a small example of how the columns might appear:
example 1 in case the freight_payment_type is "COLLECT": 

CHARGE                                 CURRENCY              PREPAID               COLLECT
---------------------------------------------------------------------------------------------------------------------
THC ORIGIN                           VND                          100000.00         
LUMSUM                                USD                                                         75.00

expected output of example 1 :
{
item: "FUEL SURCHARGE",
amount: " 75.00",
currency: "USD"
}



example 2 in case the freight_payment_type is "COLLECT": 

|CODE    TARIFF ITEM      | FREIGHTED AS | RATE             | PREPAID             | COLLECT        |
---------------------------------------------------------------------------------------------------------------------------------------------
|OCEAN FREIGHT 1          |1/40GP              | 752.00           |                               |USD 752,00    |
|THC ORIG TRML HAND  |1/40GP             | 5070000        | VND 5,707,000   |                         |


expected output of example 2 :
{
item: "OCEAN FREIGHT 1",
amount: " 752.00",
currency: "USD"
}
If freight_payment_type is "COLLECT", then we only include the row "LUMSUM" with an amount of 75.00. The row for "FUEL SURCHARGE" is excluded because the COLLECT column is empty.
- make sure to follow these steps in order to extract freight_rate_item thoroughly: 
step 1: extract all row data with corresponding column name, if you found empty space replace it with null
step 2: display it 
step 3: filter out any row which has  value null no matter what column it is 
step 4: map the remaining rows to expected schema for example 
[{
item: "LUMSUM",
amount: " 752.00",
currency: "USD"
}]

4. **Date Conversion**  
  - Convert all dates to YYYY/MM/dd format.

5. **Calculation**  
  - freight_charge_total = the **sum** of amounts from freight_rate_item **that match** the freight_payment_type.  
  - Provide **only** the final numeric result (no step-by-step math in the final JSON).`)
const userPrompt = ref(`Given a sea waybill, your task is to extract the text values of the following entities, adhering strictly to the provided JSON schema:

{
 "bl_number": null,
 "total_cartons": 0,
 "container_size_type": null,
 "hts_code": null,
 "is_port_of_arrival_door": false,
 "place_of_delivery": null,
 "port_of_discharge": null,
 "port_of_loading": null,
 "freight_payment_type": null,
 "freight_rate_item": [
 {
  "item_name": null,
"amount":null,
"currency":null
 }
 ]
,
 "container_number": [],
"seal_number": [],
 "service_contract_number": null,
 "shipped_on_board_date": null,
 "freight_charge_total": 0,
 "freight_charge_currency": "",
 "total_measurement": 0,
 "total_shipment_weight": 0
}
- freight_charge_total is sum of collect amounts if freight_payment_type COLLECT, else if freight_payment_type is PREPAID then freight_charge_total is sum of prepaid amounts`)
const result = ref('')
const error = ref('')
const loading = ref(false)
const copied = ref(false)
const showConfig = ref(false)
const configText = ref(JSON.stringify(DEFAULT_CONFIG, null, 2))
const apiConfig = ref({ ...DEFAULT_CONFIG })
const configError = ref('')

const configPlaceholder = computed(() => {
  return `// Sample Configurations:

// 1. More Creative Output
{
  "temperature": 0.8,
  "top_p": 0.9,
  "__comments": {
    "description": "Higher temperature for more varied outputs"
  }
}

// 2. More Precise Output
{
  "temperature": 0.3,
  "top_p": 0.5,
  "__comments": {
    "description": "Lower temperature for more focused outputs"
  }
}

// 3. Longer Output
{
  "temperature": 0.7,
  "max_tokens": 8000,
  "__comments": {
    "description": "Increased token limit for longer responses"
  }
}

// Default Configuration:
${JSON.stringify(DEFAULT_CONFIG, null, 2)}`
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (file?.type === 'application/pdf') {
    selectedFile.value = file
    error.value = ''
    result.value = ''
  } else {
    error.value = 'Please select a PDF file'
  }
}

const handleFileDrop = (event) => {
  const file = event.dataTransfer?.files[0]
  if (file?.type === 'application/pdf') {
    selectedFile.value = file
    error.value = ''
    result.value = ''
  } else {
    error.value = 'Please drop a PDF file'
  }
}

const submitForm = async () => {
  if (!selectedFile.value) return

  loading.value = true
  error.value = ''
  result.value = ''

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('systemPrompt', systemPrompt.value)
    formData.append('userPrompt', userPrompt.value)

    const cleanConfig = Object.entries(apiConfig.value)
      .reduce((acc, [key, value]) => {
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
  } catch (err) {
    error.value = err.message || 'An error occurred'
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
