import { ref, computed } from 'vue'
import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage'

export const DEFAULT_CONFIG = {
  temperature: 0,
  top_p: 1,
  max_tokens: null,
  presence_penalty: null,
  frequency_penalty: null
}

export const DEFAULT_PROMPTS = {
  SYSTEM: `You are an advanced document reasoning assistant. Your task is to extract and analyze data from complex tables accurately, even when they contain blank spaces, ambiguous formatting, or overlapping information. Focus on correctly associating values with their respective columns.

Here is a table with freight information. Each row belongs to a shipment, and the columns are PREPAID (amount prepaid by the sender) and COLLECT (amount to be collected from the receiver). If a cell under a column is blank, it means the value does not exist for that column for that shipment.

Table Example:

ITEM 	                          PREPAID	             COLLECT
LUMSUM                                               USD 50.00
OCEAN FREIGHT                                        USD 75.00
LTHC                            VND 30.00
DOC O/B DOC FEE                 VND 60.00

result :
[
 { "ITEM": "LUMSUM", "PREPAID": null, "COLLECT": "50.00", "CURRENCY": "USD" },
 { "ITEM": "OCEAN FREIGHT", "PREPAID": null, "COLLECT": "75.00",  "CURRENCY": "USD"},
 { "ITEM": "LTHC", "PREPAID": "30.00", "COLLECT": null, "CURRENCY": "VND"},
 { "ITE ID": "DOC O/B DOC FEE", "PREPAID": "60.00", "COLLECT": null, "CURRENCY":"VND"}
]

Instructions:
1.	Convert tabular data line items into markdown fill the blank cell with null  and display 
2.	Avoid Confusion: Do not misinterpret blank cells. Always associate each value with its correct column and do not mix up columns, even if there is an unusual pattern of blanks.
3.	Output Format: Provide the extracted as  data as schema below
{"ITEM": null, "PREPAID": null;, "COLLECT":null, "CURRENCY":null }
4.	Validation: 
       validation1: Cross-check each value with its respective column to ensure accuracy, especially for rows with blank spaces
	validation2: also make sure either PREPAID or COLLECT has value
       validation3: ensure strictly that not all PREPAID cells are null, and also not all COLLECT cells are null, that mean the PREPAID and COLLECT column must not be entirely null, if this fails then it mean you have mixed up column value 
5. find the freight payment type which can be COLLECT or PREPAID, then use it to filter the results, for example the freight payment type is COLLECT then filter to include object which COLLECT is not null
6. map the result into {"item", null, "amount": null, "currency":null}
7. push the mapped results into freight_rate_item then extract other field values as follow schema 
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
 "freight_rate_item": [
 {
 "item_name": null,
"amount":null,
"currency":null
 }
 ]
,
 "service_contract_number": null,
 "shipped_on_board_date": null,
 "freight_charge_total": 0,
 "freight_charge_currency": "",
 "total_measurement": 0,
 "total_shipment_weight": 0
}
8. Reasoning step by step, if you have struggle please explain and suggest the changes

`,
  USER: `Please extract the information from the freight charge table in the document provided`
}

export const useConfig = () => {
  const { getItem, setItem } = useLocalStorage()
  
  const showConfig = ref(false)
  const configText = ref(JSON.stringify(DEFAULT_CONFIG, null, 2))
  const apiConfig = ref(DEFAULT_CONFIG)
  const configError = ref('')
  const systemPrompt = ref(DEFAULT_PROMPTS.SYSTEM)
  const userPrompt = ref(DEFAULT_PROMPTS.USER)
  const isSystemPromptFocused = ref(false)
  const isUserPromptFocused = ref(false)

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

  const resetPrompts = () => {
    const confirmReset = window.confirm('Are you sure you want to reset prompts to default values?')
    if (confirmReset) {
      systemPrompt.value = DEFAULT_PROMPTS.SYSTEM
      userPrompt.value = DEFAULT_PROMPTS.USER
      setItem(STORAGE_KEYS.SYSTEM_PROMPT, DEFAULT_PROMPTS.SYSTEM)
      setItem(STORAGE_KEYS.USER_PROMPT, DEFAULT_PROMPTS.USER)
    }
  }

  // Initialize config from localStorage
  const initializeConfig = () => {
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
  }

  return {
    showConfig,
    configText,
    apiConfig,
    configError,
    systemPrompt,
    userPrompt,
    isSystemPromptFocused,
    isUserPromptFocused,
    configPlaceholder,
    resetConfig,
    saveConfig,
    resetPrompts,
    initializeConfig
  }
} 
