import { describe, expect, it } from 'vitest'

import { detectLocale, Locale } from '@/plugins/i18n'

describe('detectLocale', () => {
  it('returns en-us for paths under the /en-us/ segment', () => {
    expect(detectLocale('/app/en-us/')).toBe(Locale.enUs)
    expect(detectLocale('/en-us/')).toBe(Locale.enUs)
  })

  it('defaults to zh-tw for every other path', () => {
    expect(detectLocale('/')).toBe(Locale.zhTw)
    expect(detectLocale('/app/')).toBe(Locale.zhTw)
  })
})
