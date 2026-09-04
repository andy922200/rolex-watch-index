<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { ListboxRootEmits, ListboxRootProps } from 'reka-ui'
import { ListboxRoot, useForwardPropsEmits } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, provide, reactive } from 'vue'

import { cn } from '@/lib/utils'

import { commandContextKey } from './context'

const props = withDefaults(defineProps<ListboxRootProps & { class?: HTMLAttributes['class'] }>(), {
  highlightOnHover: true,
})
const emits = defineEmits<ListboxRootEmits>()
const state = reactive({ search: '' })
const normalizedSearch = computed(() => state.search.trim().toLocaleLowerCase())

provide(commandContextKey, { normalizedSearch, state })

const forwarded = useForwardPropsEmits(reactiveOmit(props, 'class'), emits)
</script>

<template>
  <ListboxRoot
    data-slot="command"
    v-bind="forwarded"
    :class="
      cn(
        'bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md',
        props.class,
      )
    "
  >
    <slot :search="state.search" />
  </ListboxRoot>
</template>
