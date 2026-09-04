<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, inject } from 'vue'

import { cn } from '@/lib/utils'

import { commandContextKey } from './context'

const props = withDefaults(
  defineProps<{ class?: HTMLAttributes['class']; selected?: boolean; value: string }>(),
  { selected: false },
)
const emit = defineEmits<{ select: [value: string] }>()
const commandContext = inject(commandContextKey)

if (!commandContext) {
  throw new Error('CommandItem must be used inside Command.')
}

const isVisible = computed(() =>
  props.value.toLocaleLowerCase().includes(commandContext.normalizedSearch.value),
)

const select = (): void => {
  emit('select', props.value)
  commandContext.state.search = ''
}
</script>

<template>
  <button
    v-if="isVisible"
    type="button"
    role="option"
    :aria-selected="selected"
    data-slot="command-item"
    :class="
      cn(
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground hover:border-border hover:bg-accent focus-visible:border-ring focus-visible:bg-accent focus-visible:ring-ring relative flex w-full cursor-default items-center gap-2 rounded-sm border border-transparent px-2 py-1.5 text-sm outline-hidden transition-colors select-none hover:cursor-pointer focus-visible:ring-2',
        props.class,
      )
    "
    @click="select"
  >
    <slot />
  </button>
</template>
