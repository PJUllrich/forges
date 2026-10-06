import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fsModuleCache: true,
    coverage: {
      include: ['src'],
      reporter: ['text', 'json', 'html'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          exclude: [...configDefaults.exclude, 'docs/**'],
          globalSetup: ['./test/setup/global.ts'],
          setupFiles: ['./test/setup/verbs.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'docs',
          include: ['docs/test/**/*.test.ts'],
          globalSetup: ['./docs/test/setup.ts'],
        },
      },
    ],
  },
})
