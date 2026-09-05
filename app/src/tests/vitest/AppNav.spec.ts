import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import AppNav from '@/components/layout/AppNav.vue'
import { i18n, Locale } from '@/plugins/i18n'

describe('AppNav', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('shows the current locale in a single-choice language select', () => {
    render(AppNav, {
      global: {
        plugins: [i18n],
      },
    })

    expect(screen.getByRole('combobox', { name: 'Language' }).textContent).toContain('English')
  })

  it('toggles the dark class on <html> and persists the preference', async () => {
    render(AppNav, {
      global: {
        plugins: [i18n],
      },
    })

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('vueuse-color-scheme')).toBe('dark')

    await fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('vueuse-color-scheme')).not.toBe('dark')
  })
})
