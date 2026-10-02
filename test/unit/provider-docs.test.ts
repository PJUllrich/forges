import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { matrix, matrixProviders, providerSection, withSection } from '../../scripts/capabilities.ts'
import * as forges from '../../src/index.ts'

describe('provider pages', () => {
  it.each(matrixProviders(forges))('keeps the $name capability section in step with the provider', ({ slug, provider }) => {
    const page = readFileSync(new URL(`../../docs/providers/${slug}.md`, import.meta.url), 'utf8')

    expect(page).toBe(withSection(page, providerSection(provider)))
  })

  it('keeps the README capability matrix in step with the providers', () => {
    const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')

    expect(readme).toBe(withSection(readme, matrix(forges)))
  })
})
