<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const navigateToLocale = (
  value: string | number | bigint | Record<string, unknown> | null,
): void => {
  if (value !== Locale.enUs && value !== Locale.zhTw) {
    return
  }

  const option = languageLinks.value.find((language) => language.code === value)

  if (option && option.code !== locale.value) {
    window.location.assign(option.href)
  }
}

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <nav class="absolute top-6 right-6 flex items-center gap-2">
    <Select :model-value="locale" @update:model-value="navigateToLocale">
      <SelectTrigger class="w-32" :aria-label="t('site.languageLabel')">
        <SelectValue :placeholder="t(`site.language.${locale}`)" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem v-for="option in languageLinks" :key="option.code" :value="option.code">
            {{ t(`site.language.${option.code}`) }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
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
