import { createI18n } from 'vue-i18n'

import enUs from '@/locales/en-us.json'
import zhTw from '@/locales/zh-tw.json'

export const Locale = {
  enUs: 'en-us',
  zhTw: 'zh-tw',
} as const

export type LocaleCode = (typeof Locale)[keyof typeof Locale]

const savedLocale = localStorage.getItem('watch-locale')
const localeCodes = [Locale.enUs, Locale.zhTw]
const isLocaleCode = (value: string | null): value is LocaleCode =>
  value !== null && localeCodes.some((localeCode) => localeCode === value)

const initialLocale = isLocaleCode(savedLocale) ? savedLocale : Locale.enUs

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: Locale.enUs,
  messages: {
    [Locale.enUs]: enUs,
    [Locale.zhTw]: zhTw,
  },
})
