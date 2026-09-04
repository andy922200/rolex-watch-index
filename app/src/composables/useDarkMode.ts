import { useDark, useToggle } from '@vueuse/core'
import type { Ref } from 'vue'

interface UseDarkModeResult {
  isDark: Readonly<Ref<boolean>>
  toggleDark: () => void
}

export const useDarkMode = (): UseDarkModeResult => {
  const isDark = useDark()

  return {
    isDark,
    toggleDark: useToggle(isDark),
  }
}
