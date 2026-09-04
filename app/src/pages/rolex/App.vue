<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Locale, type LocaleCode } from '@/plugins/i18n'

const { locale, t } = useI18n()

const selectedLocale = ref<LocaleCode>(Locale.enUs)
const languageOptions = [Locale.enUs, Locale.zhTw] as const

const pageLanguage = computed(() => selectedLocale.value)

watch(
  selectedLocale,
  (value) => {
    locale.value = value
    localStorage.setItem('watch-locale', value)
  },
  { immediate: true },
)
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
    </section>
  </main>
</template>
