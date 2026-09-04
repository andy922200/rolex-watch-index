<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue'
import { computed } from 'vue'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface WatchCollectionOption {
  id: string
  label: string
  watchCount: number
}

interface Props {
  allOptionLabel: string
  emptyMessage: string
  label: string
  options: readonly WatchCollectionOption[]
  placeholder: string
  selectedCollectionId: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [collectionId: string | null]
}>()

const labelId = 'watch-collection-label'
const isOpen = defineModel<boolean>('open', { default: false })

const selectedOption = computed(() =>
  props.options.find((option) => option.id === props.selectedCollectionId),
)
const selectOption = (collectionId: string | null): void => {
  emit('select', collectionId)
  isOpen.value = false
}

const hasMatchingOption = (search: string): boolean => {
  const normalizedSearch = search.trim().toLocaleLowerCase()

  return (
    !normalizedSearch ||
    props.allOptionLabel.toLocaleLowerCase().includes(normalizedSearch) ||
    props.options.some((option) => option.label.toLocaleLowerCase().includes(normalizedSearch))
  )
}
</script>

<template>
  <div class="relative w-full max-w-md">
    <label :id="labelId" class="mb-2 block text-sm font-medium">{{ label }}</label>
    <Popover v-model:open="isOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          role="combobox"
          :aria-expanded="isOpen"
          :aria-labelledby="labelId"
          class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 pr-10 text-left shadow-sm transition outline-none focus:ring-2"
        >
          <span :class="{ 'text-muted-foreground': !selectedOption }">
            {{ selectedOption?.label ?? placeholder }}
          </span>
          <ChevronsUpDown
            class="text-muted-foreground absolute right-2 bottom-2.5"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent class="w-(--reka-popover-trigger-width) p-0" align="start">
        <Command v-slot="{ search }">
          <CommandInput :aria-label="label" :placeholder="placeholder" />
          <CommandList>
            <CommandEmpty v-if="!hasMatchingOption(search)">{{ emptyMessage }}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                class="hover:bg-accent px-3 py-2"
                :selected="selectedCollectionId === null"
                :value="allOptionLabel"
                @select="selectOption(null)"
              >
                <Check v-if="selectedCollectionId === null" aria-hidden="true" />
                <span :class="{ 'pl-6': selectedCollectionId !== null }">{{ allOptionLabel }}</span>
              </CommandItem>
              <CommandItem
                v-for="option in options"
                :key="option.id"
                class="hover:bg-accent flex justify-between px-3 py-2"
                :selected="option.id === selectedCollectionId"
                :value="option.label"
                @select="selectOption(option.id)"
              >
                <Check v-if="option.id === selectedCollectionId" aria-hidden="true" />
                <span :class="{ 'pl-6': option.id !== selectedCollectionId }">{{
                  option.label
                }}</span>
                <span class="text-muted-foreground ml-auto text-sm">{{ option.watchCount }}</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>
</template>
