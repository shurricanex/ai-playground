<template>
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
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useConfig } from '~/composables/useConfig'

const {
  showConfig,
  configText,
  configError,
  configPlaceholder,
  resetConfig,
  saveConfig
} = useConfig()
</script> 
