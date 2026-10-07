import { describe, expect, it, vi } from 'vitest'
import { getContributors } from '../../docs/server/utils/contributors.ts'
import { contributorHomepage, getFooterContributors } from '../../docs/server/utils/footer-contributors.ts'
import { githubLite } from '../../src/github/index.ts'

const profileUrl = 'https://github.com/trueberryless'

describe('contributor homepages', () => {
  it.each([
    ['https://felixs.dev', 'https://felixs.dev/'],
    ['felixs.dev', 'https://felixs.dev/'],
    [' http://felixs.dev/about ', 'http://felixs.dev/about'],
    ['', profileUrl],
    [null, profileUrl],
    ['not a website', profileUrl],
    ['javascript:alert(1)', profileUrl],
    ['mailto:hello@example.com', profileUrl],
  ])('resolves %s to %s', (blog, expected) => {
    expect(contributorHomepage(blog, profileUrl)).toBe(expected)
  })
})

describe('footer contributors', () => {
  it('keeps danielroe first and selects the top three other non-bot contributors', async () => {
    const websites: Record<string, string> = { danielroe: 'https://roe.dev', trueberryless: 'felixs.dev' }
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-token')
      const path = new URL(url).pathname
      if (path.startsWith('/repos/')) {
        expect(new URL(url).searchParams.get('per_page')).toBe('100')
        return Response.json([
          { login: 'fourth', contributions: 1, type: 'User' },
          { login: 'antfu', contributions: 5, type: 'User' },
          { login: 'renovate[bot]', contributions: 200, type: 'Bot' },
          { login: 'automation[bot]', contributions: 150, type: 'User' },
          { login: 'danielroe', contributions: 100, type: 'User' },
          { login: 'third', contributions: 2, type: 'User' },
          { login: 'trueberryless', contributions: 6, type: 'User' },
        ].map(contributor => ({
          ...contributor,
          html_url: `https://github.com/${contributor.login}`,
          avatar_url: `https://avatars.githubusercontent.com/${contributor.login}?v=4`,
        })))
      }
      const login = path.slice('/users/'.length)
      return Response.json({ login, html_url: `https://github.com/${login}`, blog: websites[login] ?? '' })
    })
    const forge = githubLite({ fetch, auth: { type: 'token', token: 'test-token' } }).create()
    const list = await getContributors(forge)

    expect(list.map(contributor => contributor.login)).toEqual(['danielroe', 'trueberryless', 'antfu', 'third', 'fourth'])
    expect(list[1]).toEqual({
      login: 'trueberryless',
      contributions: 6,
      avatarUrl: 'https://avatars.githubusercontent.com/trueberryless?v=4',
      url: profileUrl,
    })
    expect(await getFooterContributors(forge, list)).toEqual([
      { login: 'danielroe', to: 'https://roe.dev/' },
      { login: 'trueberryless', to: 'https://felixs.dev/' },
      { login: 'antfu', to: 'https://github.com/antfu' },
      { login: 'third', to: 'https://github.com/third' },
    ])
    expect(fetch).toHaveBeenCalledTimes(5)
  })

  it('handles fewer than three contributors and a failed profile lookup', async () => {
    const forge = githubLite({
      fetch: async (url) => {
        if (new URL(url).pathname.startsWith('/repos/')) {
          return Response.json([{
            login: 'trueberryless',
            contributions: 6,
            type: 'User',
            html_url: profileUrl,
            avatar_url: 'https://avatars.githubusercontent.com/trueberryless?v=4',
          }])
        }
        return new Response('Unavailable', { status: 503 })
      },
    }).create()
    expect(await getFooterContributors(forge, await getContributors(forge))).toEqual([
      { login: 'danielroe', to: 'https://github.com/danielroe' },
      { login: 'trueberryless', to: profileUrl },
    ])
  })

  it('keeps danielroe when GitHub is unavailable', async () => {
    const forge = githubLite({ fetch: async () => new Response('Unavailable', { status: 503 }) }).create()
    const list = await getContributors(forge).catch(() => [])
    expect(await getFooterContributors(forge, list)).toEqual([
      { login: 'danielroe', to: 'https://github.com/danielroe' },
    ])
  })
})
