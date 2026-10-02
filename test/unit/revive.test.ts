import { describe, expect, it } from 'vitest'
import { github } from '../../src/github/index.ts'
import { reviveDates } from '../../src/index.ts'
import { fixtureFetch } from '../../src/testing/index.ts'

describe('serialisation helpers', () => {
  it('revives model dates at any depth after a JSON round trip', () => {
    const value = { items: [{ createdAt: new Date('2026-01-02T03:04:05Z'), title: '2026-01-02', nested: { occurredAt: new Date(0) } }] }
    const revived = reviveDates(JSON.parse(JSON.stringify(value)))

    expect(revived).toEqual(value)
    expect(revived.items[0]!.title).toBe('2026-01-02')
  })

  it('reports the request budget on pages and raw responses', async () => {
    const headers = { 'x-ratelimit-limit': '5000', 'x-ratelimit-remaining': '4999', 'x-ratelimit-reset': '1767225600' }
    const { fetch } = fixtureFetch([
      { request: { method: 'GET', url: 'https://api.github.com/user/repos?per_page=100' }, response: { status: 200, headers, body: [] } },
      { request: { method: 'GET', url: 'https://api.github.com/rate_limit' }, response: { status: 200, headers, body: {} } },
    ])
    const provider = github({ auth: { type: 'token', token: 't' }, fetch }).create()
    const expected = { limit: 5000, remaining: 4999, resetAt: new Date(1767225600 * 1000) }

    expect((await provider.repos.listPage({ perPage: 100 })).rateLimit).toEqual(expected)
    expect((await provider.request('GET', '/rate_limit')).rateLimit).toEqual(expected)
  })
})
