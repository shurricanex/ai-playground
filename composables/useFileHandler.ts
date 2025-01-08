import { ref } from 'vue'
import type { PDFFileMetadata } from '~/types/bill-extractor'
import { useLocalStorage, STORAGE_KEYS } from './useLocalStorage'

// Create shared state
const selectedFile = ref<File | null>(null)
const pdfUrl = ref<string | null>(null)
const error = ref('')
const currentPage = ref(1)

export const useFileHandler = () => {
  const { setItem, removeItem } = useLocalStorage()

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

  const cleanupFileUrl = () => {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }
    selectedFile.value = null;
    if (process.client) {
      removeItem(STORAGE_KEYS.PDF_FILE);
    }
  }

  return {
    selectedFile,
    pdfUrl,
    error,
    currentPage,
    formatFileSize,
    handleFileChange,
    handleFileDrop,
    cleanupFileUrl
  }
} 
