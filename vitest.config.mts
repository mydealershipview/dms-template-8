import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  resolve: { alias: { 'server-only': new URL('./tests/server-only.ts', import.meta.url).pathname } },
  plugins: [tsconfigPaths(), react()],
  test: {
    globalSetup: ['./tests/mongo-setup.ts'],
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}'],
  },
})
