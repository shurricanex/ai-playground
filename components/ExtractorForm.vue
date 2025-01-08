<template>
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
      @click="$emit('submit')"
      :disabled="!selectedFile || loading"
      class="w-full mt-4 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
    >
      <SpinnerIcon v-if="loading" class="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
      <span>{{ loading ? 'Processing...' : 'Extract Information' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Cog6ToothIcon } from '@heroicons/vue/24/outline'
import SpinnerIcon from '~/components/SpinnerIcon.vue'
import { useConfig } from '~/composables/useConfig'
import { useFileHandler } from '~/composables/useFileHandler'
import { useExtractor } from '~/composables/useExtractor'

const { selectedFile } = useFileHandler()
const { loading } = useExtractor()
const {
  showConfig,
  apiConfig,
  systemPrompt,
  userPrompt,
  isSystemPromptFocused,
  isUserPromptFocused,
  resetPrompts
} = useConfig()

defineEmits<{
  (e: 'submit'): void
}>()
</script> 
