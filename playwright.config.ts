import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 90000,
  expect: { timeout: 15000 },
  use: { baseURL: 'http://127.0.0.1:4184', headless: false },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 4184 --strictPort', url: 'http://127.0.0.1:4184', reuseExistingServer: false },
})
