import { getFooterContributors } from '../utils/footer-contributors'

export default defineCachedEventHandler(async (event) => {
  const { githubToken } = useRuntimeConfig(event)
  return getFooterContributors(<T>(path: string) => $fetch<T>(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...githubToken ? { Authorization: `Bearer ${githubToken}` } : {},
    },
    timeout: 5000,
    retry: 0,
  }))
}, {
  maxAge: 60 * 60,
  getKey: () => 'footer-contributors',
})
