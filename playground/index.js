import assert from 'node:assert'
import { createForges } from 'forges'

const forges = createForges([])

// eslint-disable-next-line no-console
console.log(forges.providers)

assert.deepStrictEqual(forges.providers, [])
