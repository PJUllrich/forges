interface GitHubContributor {
  login: string
  type: string
  contributions: number
}

interface GitHubProfile {
  html_url: string
  blog: string | null
}

type GitHubFetch = <T>(path: string) => Promise<T>

export function contributorHomepage(blog: string | null, profileUrl: string): string {
  const website = blog?.trim()
  if (!website) {
    return profileUrl
  }

  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(website) ? website : `https://${website}`)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : profileUrl
  }
  catch {
    return profileUrl
  }
}

export async function getFooterContributors(fetchGitHub: GitHubFetch) {
  const list = await fetchGitHub<GitHubContributor[]>('/repos/danielroe/forges/contributors?per_page=100').catch(() => [])
  const topContributors = list
    .filter(contributor => contributor.type === 'User' && contributor.login.toLowerCase() !== 'danielroe' && !contributor.login.endsWith('[bot]'))
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 3)

  return Promise.all(['danielroe', ...topContributors.map(contributor => contributor.login)].map(async (login) => {
    const fallback = `https://github.com/${login}`
    const profile = await fetchGitHub<GitHubProfile>(`/users/${login}`).catch(() => null)
    return { login, to: profile ? contributorHomepage(profile.blog, profile.html_url) : fallback }
  }))
}
