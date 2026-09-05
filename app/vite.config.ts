import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'
import { createMpaPlugin } from 'vite-plugin-virtual-mpa'
import { defineConfig } from 'vitest/config'

import { useHttpsConfig } from './src/composables/useHttpsConfig.ts'
import { createMpaConfig } from './src/lib/mpa-build.ts'

export const projectName = 'app'
export const ghPagesRepoName = 'rolex-watch-index'
export const base = `/${projectName}/`
export const ghPagesBase = `/${ghPagesRepoName}/${projectName}/`

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isViteEnvProd = env.VITE_BUILD_ENV === 'prod'
  const catalogSource = readFileSync(
    fileURLToPath(new URL('../data/catelog/rolex-catalog.json', import.meta.url)),
  )
  const watchDataVersion = createHash('sha256').update(catalogSource).digest('hex').slice(0, 12)

  const activeBase = isViteEnvProd ? ghPagesBase : base
  const { pages, rewrites } = createMpaConfig({
    isProd: isViteEnvProd,
    base: activeBase,
    ghPagesRepoName,
    projectName,
  })

  return {
    base: activeBase,
    define: {
      __WATCH_DATA_VERSION__: JSON.stringify(watchDataVersion),
    },
    plugins: [
      vue(),
      tailwindcss(),
      createMpaPlugin({
        template: 'rolex.html',
        pages,
        rewrites,
        previewRewrites: rewrites,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5199,
      https: useHttpsConfig() || undefined,
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
