<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import WatchCollectionCombobox, {
  type WatchCollectionOption,
} from '@/components/watch-collection/WatchCollectionCombobox.vue'
import { useWatchCatalog } from '@/composables/useWatchCatalog'
import { Locale, type LocaleCode } from '@/plugins/i18n'

const { locale, t } = useI18n()

const selectedLocale = ref<LocaleCode>(Locale.enUs)
const selectedCollectionId = ref<string | null>(null)
const languageOptions = [Locale.enUs, Locale.zhTw] as const
const { catalog, error, isLoading, loadCatalog } = useWatchCatalog()

const pageLanguage = computed(() => selectedLocale.value)
const collectionOptions = computed<WatchCollectionOption[]>(() =>
  (catalog.value?.collections ?? []).map((collection) => ({
    id: collection.id,
    label: t(`site.watchCollection.${collection.id}`),
    watchCount: collection.watchCount,
  })),
)

const selectCollection = (collectionId: string | null): void => {
  selectedCollectionId.value = collectionId
}

watch(
  selectedLocale,
  (value) => {
    locale.value = value
    localStorage.setItem('watch-locale', value)
  },
  { immediate: true },
)

onMounted(loadCatalog)
</script>

<template>
  <main
    class="flex min-h-dvh items-center justify-center bg-stone-100 px-6 py-12 text-stone-950 dark:bg-stone-950 dark:text-stone-100"
    :lang="pageLanguage"
  >
    <section class="w-full max-w-4xl text-center" aria-labelledby="page-title">
      <label class="sr-only" for="language">{{ t('site.languageLabel') }}</label>
      <select
        id="language"
        v-model="selectedLocale"
        class="absolute top-6 right-6 rounded-sm border border-stone-400 bg-white px-3 py-2 text-sm text-stone-950 shadow-sm transition outline-none focus:ring-2 focus:ring-stone-950 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-stone-100"
      >
        <option v-for="option in languageOptions" :key="option" :value="option">
          {{ t(`site.language.${option}`) }}
        </option>
      </select>

      <h1 id="page-title" class="hero-title text-4xl font-semibold tracking-tight sm:text-6xl">
        {{ t('site.title') }}
      </h1>
      <div class="mt-10 flex justify-center">
        <WatchCollectionCombobox
          v-if="!isLoading && !error"
          :all-option-label="t('site.watchCollection.all')"
          :empty-message="t('site.watchCollection.empty')"
          :label="t('site.watchCollection.label')"
          :options="collectionOptions"
          :placeholder="t('site.watchCollection.placeholder')"
          :selected-collection-id="selectedCollectionId"
          @select="selectCollection"
        />
        <p v-else-if="isLoading" role="status">{{ t('site.watchCollection.loading') }}</p>
        <p v-else role="alert">{{ t('site.watchCollection.error') }}</p>
      </div>
    </section>
  </main>
</template>
