import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

import { useHttpsConfig } from './src/composables/useHttpsConfig.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const projectName = 'app'
  const isViteEnvProd = env.VITE_BUILD_ENV === 'prod'

  return {
    base: isViteEnvProd ? '/' : `/${projectName}`,
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5199,
      https: useHttpsConfig() || undefined,
    },
    build: {
      rollupOptions: {
        input: {
          rolex: fileURLToPath(new URL('./rolex.html', import.meta.url)),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/tests/vitest/setup.ts',
      include: ['./src/tests/vitest/**/*.{spec,test}.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
