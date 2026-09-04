<script setup lang="ts">
import { Search } from '@lucide/vue'
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'

import { cn } from '@/lib/utils'

import { commandContextKey } from './context'

defineOptions({ inheritAttrs: false })

const props = defineProps<{ class?: HTMLAttributes['class']; placeholder?: string }>()
const commandContext = inject(commandContextKey)

if (!commandContext) {
  throw new Error('CommandInput must be used inside Command.')
}
</script>

<template>
  <div data-slot="command-input-wrapper" class="flex h-9 items-center gap-2 border-b px-3">
    <Search class="size-4 shrink-0 opacity-50" />
    <input
      v-model="commandContext.state.search"
      data-slot="command-input"
      v-bind="$attrs"
      autocomplete="off"
      :class="
        cn(
          'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden',
          props.class,
        )
      "
      :placeholder="placeholder"
    />
  </div>
</template>
