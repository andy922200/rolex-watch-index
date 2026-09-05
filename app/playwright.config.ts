import { defineConfig, devices } from '@playwright/test'

import { useHttpsConfig } from './src/composables/useHttpsConfig.ts'
import { base } from './vite.config.ts'

const host = '127.0.0.1'
const port = 4173
const hasHttpsConfig = useHttpsConfig() !== false
const protocol = hasHttpsConfig ? 'https' : 'http'
const baseURL = `${protocol}://${host}:${port}${base}`

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL,
    ignoreHTTPSErrors: hasHttpsConfig,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm run build:watch-data -- --output-directory public/watch-data && pnpm exec vite --host ${host} --port ${port}`,
    ignoreHTTPSErrors: hasHttpsConfig,
    port,
    reuseExistingServer: !process.env.CI,
  },
})
