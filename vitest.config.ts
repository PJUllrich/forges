import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fsModuleCache: true,
    globalSetup: ['./test/setup/global.ts'],
    setupFiles: ['./test/setup/verbs.ts'],
    coverage: {
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
})
