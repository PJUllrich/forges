import { describe, expect, it, vi } from 'vitest'
import { contributorHomepage, getFooterContributors } from '../../docs/server/utils/footer-contributors.ts'

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
    const fetchGitHub = vi.fn(async (path: string) => {
      if (path.startsWith('/repos/')) {
        return [
          { login: 'fourth', contributions: 1, type: 'User' },
          { login: 'antfu', contributions: 5, type: 'User' },
          { login: 'renovate[bot]', contributions: 200, type: 'Bot' },
          { login: 'danielroe', contributions: 100, type: 'User' },
          { login: 'third', contributions: 2, type: 'User' },
          { login: 'trueberryless', contributions: 6, type: 'User' },
        ]
      }
      const login = path.slice('/users/'.length)
      return { html_url: `https://github.com/${login}`, blog: login === 'danielroe' ? 'https://roe.dev' : '' }
    })
    const contributors = await getFooterContributors(fetchGitHub as Parameters<typeof getFooterContributors>[0])

    expect(contributors).toEqual([
      { login: 'danielroe', to: 'https://roe.dev/' },
      { login: 'trueberryless', to: 'https://github.com/trueberryless' },
      { login: 'antfu', to: 'https://github.com/antfu' },
      { login: 'third', to: 'https://github.com/third' },
    ])
    expect(fetchGitHub).toHaveBeenCalledTimes(5)
  })

  it('handles fewer than three contributors and a failed profile lookup', async () => {
    const fetchGitHub = vi.fn(async (path: string) => {
      if (path.startsWith('/repos/')) {
        return [{ login: 'trueberryless', contributions: 6, type: 'User' }]
      }
      throw new Error('Unavailable')
    })
    expect(await getFooterContributors(fetchGitHub as Parameters<typeof getFooterContributors>[0])).toEqual([
      { login: 'danielroe', to: 'https://github.com/danielroe' },
      { login: 'trueberryless', to: 'https://github.com/trueberryless' },
    ])
  })

  it('keeps danielroe when GitHub is unavailable', async () => {
    expect(await getFooterContributors(async () => { throw new Error('Unavailable') })).toEqual([
      { login: 'danielroe', to: 'https://github.com/danielroe' },
    ])
  })
})
