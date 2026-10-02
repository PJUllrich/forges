import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/testing/index.ts', 'src/fake/index.ts'],
  dts: { oxc: true },
  exports: { devExports: true },
  publint: true,
  attw: {
    profile: 'esm-only',
    level: 'error',
  },
})
