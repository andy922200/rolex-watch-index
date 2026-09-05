import { fireEvent, render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'

import AppNav from '@/components/layout/AppNav.vue'
import { i18n, Locale } from '@/plugins/i18n'

describe('AppNav', () => {
  beforeEach(() => {
    i18n.global.locale.value = Locale.enUs
  })

  it('marks the active language link and points the other one at its locale page', () => {
    render(AppNav, {
      global: {
        plugins: [i18n],
      },
    })

    const englishLink = screen.getByRole('link', { name: 'English' })
    const chineseLink = screen.getByRole('link', { name: '繁體中文' })

    expect(englishLink.getAttribute('aria-current')).toBe('page')
    expect(englishLink.getAttribute('href')).toBe(`${import.meta.env.BASE_URL}en-us/`)
    expect(chineseLink.getAttribute('aria-current')).toBeNull()
    expect(chineseLink.getAttribute('href')).toBe(import.meta.env.BASE_URL)
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
