import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, it } from 'vitest'

import App from '@/pages/rolex/App.vue'
import { i18n, Locale } from '@/plugins/i18n'

describe('Rolex index page', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('renders the page content in the active locale', () => {
    render(App, {
      global: {
        plugins: [i18n],
      },
    })

    screen.getByRole('heading', { name: 'Your Global Rolex Watches Index' })
  })
})
