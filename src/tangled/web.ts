import type { RepoRef, ThreadKind } from '../model.ts'
import type { WebLinks } from '../web.ts'

const SECTIONS: Partial<Record<ThreadKind, string>> = { issue: 'issues', pull_request: 'pulls' }

const repoPath = (repo: RepoRef) => `/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`

/** Tangled pages address threads by their display number, so parsed refs carry `displayNumber` and need resolving. */
export function tangledWeb(origin: string): WebLinks {
  return {
    origin,
    repo: repoPath,
    thread: ref => SECTIONS[ref.kind] && ref.displayNumber ? `${repoPath(ref.repo)}/${SECTIONS[ref.kind]}/${encodeURIComponent(ref.displayNumber)}` : undefined,
    parse: (segments, _url, from) => {
      const [owner, name, section, id] = segments
      if (!owner || !name) {
        return undefined
      }
      const repo: RepoRef = { ...from, owner: owner.replace(/^@/, ''), name }
      const kind = section === 'issues' ? 'issue' : section === 'pulls' ? 'pull_request' : undefined
      return kind && id ? { repo, thread: { ...from, repo, kind, displayNumber: id } } : { repo }
    },
  }
}
