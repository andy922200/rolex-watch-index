import type { Page, RewriteRule } from 'vite-plugin-virtual-mpa'
import { createPages } from 'vite-plugin-virtual-mpa'

interface CreateMpaConfigOptions {
  isProd: boolean
  base: string
  ghPagesRepoName: string
  projectName: string
}

interface MpaConfig {
  pages: Page[]
  rewrites: Exclude<RewriteRule, false>
}

/**
 * 繁中（預設）與英文各自產出獨立的靜態 HTML，讓 LINE 等不執行 JS 的分享預覽服務
 * 也能拿到對應語言的 title/description/OG image。
 */
export const createMpaConfig = ({
  isProd,
  base,
  ghPagesRepoName,
  projectName,
}: CreateMpaConfigOptions): MpaConfig => {
  const siteUrl = isProd
    ? `https://andy922200.github.io/${ghPagesRepoName}/${projectName}`
    : 'http://localhost:5199/app'
  const zhTwUrl = `${siteUrl}/`
  const enUrl = `${siteUrl}/en-us/`

  const rewrites: Exclude<RewriteRule, false> = [
    { from: new RegExp(`^${base}en-us/?$`), to: `${base}en-us/index.html` },
    { from: new RegExp(`^${base}$`), to: `${base}index.html` },
  ]

  const pages = createPages([
    {
      name: 'rolex-zh-tw',
      filename: 'index.html',
      entry: '/src/pages/rolex/main.ts',
      data: {
        lang: 'zh-tw',
        title: 'Rolex 腕錶索引',
        description: '您的全球 Rolex 腕錶索引',
        url: zhTwUrl,
        alternateLang: 'en-us',
        alternateUrl: enUrl,
        defaultUrl: zhTwUrl,
        ogImage: `${siteUrl}/og-image-zh-tw.png`,
        ogLocale: 'zh_TW',
        ogLocaleAlternate: 'en_US',
      },
    },
    {
      name: 'rolex-en-us',
      filename: 'en-us/index.html',
      entry: '/src/pages/rolex/main.ts',
      data: {
        lang: 'en-us',
        title: 'Rolex Watch Index',
        description: 'Your Global Rolex Watches Index',
        url: enUrl,
        alternateLang: 'zh-tw',
        alternateUrl: zhTwUrl,
        defaultUrl: zhTwUrl,
        ogImage: `${siteUrl}/og-image-en.png`,
        ogLocale: 'en_US',
        ogLocaleAlternate: 'zh_TW',
      },
    },
  ])

  return { pages, rewrites }
}
