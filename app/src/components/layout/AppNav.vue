<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Locale, type LocaleCode } from '@/plugins/i18n'

const { t } = useI18n()

const languageOptions = [Locale.enUs, Locale.zhTw] as const

const selectedLocale = defineModel<LocaleCode>({ required: true })
</script>

<template>
  <nav>
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
  </nav>
</template>
