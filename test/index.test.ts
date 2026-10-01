import { describe, expect, it } from 'vitest'
import { welcome } from '../src/index.ts'

describe('forges', () => {
  it('works', () => {
    expect(welcome()).toMatchInlineSnapshot('"hello world"')
  })
})
