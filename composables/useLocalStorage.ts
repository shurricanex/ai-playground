export const useLocalStorage = () => {
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

  const removeItem = (key: string) => {
    if (process.client) {
      localStorage.removeItem(key)
    }
  }

  return { getItem, setItem, removeItem }
}

export const STORAGE_KEYS = {
  SYSTEM_PROMPT: 'bill-extractor-system-prompt',
  USER_PROMPT: 'bill-extractor-user-prompt',
  API_CONFIG: 'bill-extractor-api-config',
  PDF_FILE: 'bill-extractor-pdf-file'
} 
