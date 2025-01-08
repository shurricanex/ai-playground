import { ref } from 'vue'
import * as XLSX from 'xlsx'
import type { BillInfo } from '~/types/bill-extractor'

export const useExport = () => {
  const copied = ref(false)
  const error = ref('')

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

  const downloadResults = (result: string) => {
    if (!result) return
    
    const blob = new Blob([result], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bill-info-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyResults = async (result: string) => {
    if (!result) return
    
    try {
      await navigator.clipboard.writeText(result)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (err) {
      error.value = 'Failed to copy to clipboard'
    }
  }

  const downloadExcel = (result: string) => {
    if (!result) return

    try {
      const excelBuffer = jsonToExcel(result)
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

  return {
    copied,
    error,
    downloadResults,
    copyResults,
    downloadExcel
  }
} 
