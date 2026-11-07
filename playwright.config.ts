import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${process.env.FIXTURE_APP_PORT || '54820'}`,
    ignoreHTTPSErrors: true,
    launchOptions: { args: ['--ignore-certificate-errors'] },
    channel: existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
      ? 'chrome'
      : undefined,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
