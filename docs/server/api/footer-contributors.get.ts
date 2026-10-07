import { getFooterContributors } from '../utils/footer-contributors.ts'
import { createDocsGitHub, getGitHubContributors } from '../utils/github.ts'

export default defineCachedEventHandler(async (event) => {
  const { githubToken } = useRuntimeConfig(event)
  const contributors = await getGitHubContributors(githubToken).catch(() => [])
  return getFooterContributors(createDocsGitHub(githubToken), contributors)
}, {
  maxAge: 60 * 60,
  getKey: () => 'footer-contributors',
})
