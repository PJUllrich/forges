import type { ForgeProvider } from 'forges'

interface GitHubContributor {
  login: string
  type: string
  contributions: number
  avatar_url: string
  html_url: string
}

export async function getContributors(forge: Pick<ForgeProvider, 'request'>) {
  const { data } = await forge.request<GitHubContributor[]>('GET', '/repos/danielroe/forges/contributors', {
    query: { per_page: 100 },
  })
  return data
    .filter(contributor => contributor.type === 'User' && !contributor.login.endsWith('[bot]'))
    .sort((a, b) => b.contributions - a.contributions)
    .map(contributor => ({
      login: contributor.login,
      contributions: contributor.contributions,
      avatarUrl: contributor.avatar_url,
      url: contributor.html_url,
    }))
}
