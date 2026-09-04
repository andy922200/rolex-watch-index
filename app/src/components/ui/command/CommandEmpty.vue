<script setup lang="ts">
import { computed, inject } from 'vue'

import { commandContextKey } from './context'

const commandContext = inject(commandContextKey)

if (!commandContext) {
  throw new Error('CommandEmpty must be used inside Command.')
}

const isEmpty = computed(() => commandContext.normalizedSearch.value.length > 0)
</script>

<template>
  <div v-if="isEmpty" data-slot="command-empty" class="py-6 text-center text-sm">
    <slot />
  </div>
</template>
