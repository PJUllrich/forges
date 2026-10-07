import { getGitHubContributors } from '../utils/github.ts'

export default defineEventHandler(async (event) => {
  const { githubToken } = useRuntimeConfig(event)
  return getGitHubContributors(githubToken).catch(() => [])
})
