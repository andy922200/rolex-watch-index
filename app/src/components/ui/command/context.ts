import type { ComputedRef, InjectionKey } from 'vue'

export interface CommandContext {
  normalizedSearch: ComputedRef<string>
  state: {
    search: string
  }
}

export const commandContextKey: InjectionKey<CommandContext> = Symbol('CommandContext')
