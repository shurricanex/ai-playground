import { ref } from 'vue'
import { defineAsyncComponent } from 'vue'

export const usePdfViewer = () => {
  const showPdf = ref(true)
  const currentPage = ref(1)
  const zoomLevel = ref(1)
  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 3

  const VuePdfEmbed = defineAsyncComponent(() => 
    import('vue-pdf-embed')
  )

  const togglePdfView = () => {
    showPdf.value = !showPdf.value
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

  return {
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
  }
} 
