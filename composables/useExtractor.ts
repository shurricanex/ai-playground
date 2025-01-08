import { ref, computed } from 'vue'
import type { BillInfo } from '~/types/bill-extractor'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

// Create shared state
const loading = ref(false)
const error = ref('')
const result = ref('')
const extractionDuration = ref<number | null>(null)
const displayMode = ref<'json' | 'markdown'>('json')

export const useExtractor = () => {
  const submitForm = async (
    selectedFile: File | null,
    systemPrompt: string,
    userPrompt: string,
    apiConfig: Record<string, any>
  ) => {
    if (!selectedFile) return

    loading.value = true
    error.value = ''
    result.value = ''
    extractionDuration.value = null
    const startTime = performance.now()

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('systemPrompt', systemPrompt)
      formData.append('userPrompt', userPrompt)

      const cleanConfig = Object.entries(apiConfig)
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
      extractionDuration.value = (performance.now() - startTime) / 1000 // Convert to seconds
    } catch (err: any) {
      error.value = err?.message || 'An error occurred'
    } finally {
      loading.value = false
    }
  }

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

  return {
    loading,
    error,
    result,
    extractionDuration,
    displayMode,
    formattedResult,
    markdownResult,
    submitForm
  }
} 
