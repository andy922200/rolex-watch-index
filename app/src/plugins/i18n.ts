import { createI18n } from 'vue-i18n'

import enUs from '@/locales/en-us.json'
import zhTw from '@/locales/zh-tw.json'

export const Locale = {
  enUs: 'en-us',
  zhTw: 'zh-tw',
} as const

export type LocaleCode = (typeof Locale)[keyof typeof Locale]

/**
 * 語系現在由靜態頁面路徑決定（預設為繁中根路徑，英文在 /en-us/），而非執行期切換，
 * 這樣爬蟲與 LINE 等不執行 JS 的分享預覽服務也能拿到對應語言的 head 內容。
 */
export const detectLocale = (pathname: string): LocaleCode =>
  pathname.includes(`/${Locale.enUs}/`) ? Locale.enUs : Locale.zhTw

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(window.location.pathname),
  fallbackLocale: Locale.enUs,
  messages: {
    [Locale.enUs]: enUs,
    [Locale.zhTw]: zhTw,
  },
})
