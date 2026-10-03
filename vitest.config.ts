import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fsModuleCache: true,
    coverage: {
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
  },
})
