<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import WatchCollectionCombobox, {
  type WatchCollectionOption,
} from '@/components/watch-collection/WatchCollectionCombobox.vue'
import { useWatchCatalog } from '@/composables/useWatchCatalog'

const { locale, t } = useI18n()

const selectedCollectionId = ref<string | null>(null)
const { catalog, error, isLoading, loadCatalog } = useWatchCatalog()

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

onMounted(loadCatalog)
</script>

<template>
  <AppLayout :lang="locale">
    <AppNav />
    <section class="w-full max-w-4xl text-center" aria-labelledby="page-title">
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
  </AppLayout>
</template>
