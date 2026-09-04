<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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

const inputId = 'watch-collection-combobox'
const listboxId = 'watch-collection-listbox'
const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(-1)

const selectedOption = computed(() =>
  props.options.find((option) => option.id === props.selectedCollectionId),
)
const inputValue = computed(() =>
  isOpen.value ? query.value : (selectedOption.value?.label ?? ''),
)
const filteredOptions = computed(() => {
  const normalizedQuery = query.value.trim().toLocaleLowerCase()

  if (!normalizedQuery) {
    return props.options
  }

  return props.options.filter((option) =>
    option.label.toLocaleLowerCase().includes(normalizedQuery),
  )
})

const openListbox = (): void => {
  isOpen.value = true
  query.value = ''
  activeIndex.value = selectedOption.value
    ? filteredOptions.value.findIndex((option) => option.id === selectedOption.value?.id)
    : 0
}

const closeListbox = (): void => {
  isOpen.value = false
  query.value = ''
  activeIndex.value = -1
}

const selectOption = (collectionId: string | null): void => {
  emit('select', collectionId)
  closeListbox()
}

const onInput = (event: Event): void => {
  query.value = (event.target as HTMLInputElement).value
  isOpen.value = true
  activeIndex.value = filteredOptions.value.length > 0 ? 0 : -1
}

const onKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isOpen.value) openListbox()
    else activeIndex.value = Math.min(activeIndex.value + 1, filteredOptions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) openListbox()
    else activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter' && isOpen.value && activeIndex.value >= 0) {
    event.preventDefault()
    selectOption(filteredOptions.value[activeIndex.value]?.id ?? null)
  } else if (event.key === 'Escape') {
    closeListbox()
  }
}

watch(filteredOptions, (options) => {
  if (activeIndex.value >= options.length) activeIndex.value = options.length - 1
})
</script>

<template>
  <div class="relative w-full max-w-md">
    <label :for="inputId" class="mb-2 block text-sm font-medium">{{ label }}</label>
    <input
      :id="inputId"
      :value="inputValue"
      role="combobox"
      :aria-activedescendant="activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined"
      :aria-controls="listboxId"
      :aria-expanded="isOpen"
      aria-autocomplete="list"
      autocomplete="off"
      class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 pr-10 text-left shadow-sm transition outline-none focus:ring-2"
      :placeholder="placeholder"
      @blur="closeListbox"
      @focus="openListbox"
      @input="onInput"
      @keydown="onKeydown"
    />
    <button
      type="button"
      class="text-muted-foreground hover:text-foreground focus:ring-ring absolute right-2 bottom-1.5 rounded p-1 focus:ring-2 focus:outline-none"
      :aria-expanded="isOpen"
      :aria-label="label"
      @mousedown.prevent
      @click="isOpen ? closeListbox() : openListbox()"
    >
      <span aria-hidden="true">⌄</span>
    </button>
    <ul
      v-if="isOpen"
      :id="listboxId"
      role="listbox"
      class="bg-popover absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border p-1 text-left shadow-lg"
    >
      <li
        :id="`${listboxId}-all`"
        role="option"
        :aria-selected="selectedCollectionId === null"
        class="hover:bg-accent cursor-pointer rounded px-3 py-2"
        @mousedown.prevent="selectOption(null)"
      >
        {{ allOptionLabel }}
      </li>
      <li
        v-for="(option, index) in filteredOptions"
        :id="`${listboxId}-option-${index}`"
        :key="option.id"
        role="option"
        :aria-selected="option.id === selectedCollectionId"
        class="hover:bg-accent flex cursor-pointer items-center justify-between rounded px-3 py-2"
        :class="{ 'bg-accent': index === activeIndex }"
        @mousedown.prevent="selectOption(option.id)"
      >
        <span>{{ option.label }}</span>
        <span class="text-muted-foreground text-sm">{{ option.watchCount }}</span>
      </li>
      <li v-if="filteredOptions.length === 0" class="text-muted-foreground px-3 py-2 text-sm">
        {{ emptyMessage }}
      </li>
    </ul>
  </div>
</template>
