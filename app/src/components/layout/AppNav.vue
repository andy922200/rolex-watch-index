<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useDarkMode } from '@/composables/useDarkMode'
import { Locale } from '@/plugins/i18n'

interface LanguageLink {
  code: (typeof Locale)[keyof typeof Locale]
  href: string
}

const { t, locale } = useI18n()

const languageLinks = computed<LanguageLink[]>(() => [
  { code: Locale.zhTw, href: import.meta.env.BASE_URL },
  { code: Locale.enUs, href: `${import.meta.env.BASE_URL}en-us/` },
])

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <nav class="absolute top-6 right-6 flex items-center gap-2">
    <ul
      class="flex overflow-hidden rounded-sm border border-stone-400 text-sm shadow-sm dark:border-stone-600"
      :aria-label="t('site.languageLabel')"
    >
      <li v-for="option in languageLinks" :key="option.code">
        <a
          :href="option.href"
          :hreflang="option.code"
          :aria-current="option.code === locale ? 'page' : undefined"
          class="block px-3 py-2 transition outline-none focus-visible:ring-2 focus-visible:ring-stone-950 dark:focus-visible:ring-stone-100"
          :class="
            option.code === locale
              ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950'
              : 'bg-white text-stone-950 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800'
          "
        >
          {{ t(`site.language.${option.code}`) }}
        </a>
      </li>
    </ul>
    <button
      type="button"
      class="rounded-sm border border-stone-400 bg-white p-2 text-stone-950 shadow-sm transition outline-none focus:ring-2 focus:ring-stone-950 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-stone-100"
      :aria-label="isDark ? t('site.darkMode.switchToLight') : t('site.darkMode.switchToDark')"
      @click="toggleDark()"
    >
      <Sun v-if="isDark" class="size-4" aria-hidden="true" />
      <Moon v-else class="size-4" aria-hidden="true" />
    </button>
  </nav>
</template>
