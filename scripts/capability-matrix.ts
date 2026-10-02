import { readFileSync, writeFileSync } from 'node:fs'
import * as forges from '../src/index.ts'

import { matrix, matrixProviders, providerSection, withSection } from './capabilities.ts'

for (const { slug, provider } of matrixProviders(forges)) {
  const page = new URL(`../docs/providers/${slug}.md`, import.meta.url)
  writeFileSync(page, withSection(readFileSync(page, 'utf8'), providerSection(provider)))
}
const readme = new URL('../README.md', import.meta.url)
writeFileSync(readme, withSection(readFileSync(readme, 'utf8'), matrix(forges)))
console.info(matrix(forges))
