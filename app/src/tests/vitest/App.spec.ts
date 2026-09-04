import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/pages/rolex/App.vue'
import { i18n, Locale } from '@/plugins/i18n'

describe('Rolex index page', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('changes the page language and persists the preference', async () => {
    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    screen.getByRole('heading', { name: 'Your Global Rolex Watches Index' })

    await fireEvent.update(screen.getByLabelText('Language'), Locale.zhTw)

    screen.getByRole('heading', { name: '您的全球 Rolex 腕錶索引' })
    expect(localStorage.getItem('watch-locale')).toBe(Locale.zhTw)
  })
})
