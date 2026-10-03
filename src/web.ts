import type { CommentRef, ForgeOrigin, ReleaseRef, RepoRef, ResolvedThreadRef, ThreadRef } from './model.ts'
import { isResolvedThread } from './model.ts'

/** Something with a web page. */
export type UrlTarget
  = | { repo: RepoRef }
    | { thread: ThreadRef }
    | { comment: CommentRef }
    | { release: ReleaseRef }
    | { file: { repo: RepoRef, path: string, at: string, line?: number } }
    | { compare: { repo: RepoRef, base: string, head: string } }

/** What a forge web URL points at. `repo` is always set; the rest when the URL is that specific. */
export interface ParsedForgeUrl {
  repo: RepoRef
  thread?: ThreadRef
  comment?: CommentRef
  release?: ReleaseRef
}

export interface ReferenceOptions {
  /** Repository the reference is written in; a reference within it is the short form. */
  from?: RepoRef
  /** Request the reference expanded to its title, where the forge supports it (GitLab's `+` suffix). */
  expand?: boolean
}

/**
 * How a provider builds and reads its web URLs. Paths are relative to
 * `origin`; any builder may return `undefined` when the forge has no such page.
 */
export interface WebLinks {
  origin: string
  repo: (repo: RepoRef) => string
  thread: (ref: ResolvedThreadRef) => string | undefined
  comment?: (ref: CommentRef & { thread: ResolvedThreadRef }) => string | undefined
  release?: (ref: ReleaseRef) => string | undefined
  file?: (repo: RepoRef, path: string, at: string, line?: number) => string | undefined
  compare?: (repo: RepoRef, base: string, head: string) => string | undefined
  /** Reads a URL already known to be on `origin`, split into path segments. */
  parse: (segments: string[], url: URL, origin: ForgeOrigin) => ParsedForgeUrl | undefined
  /** The forge's cross-reference syntax; `undefined` falls back to the thread URL. */
  reference?: (ref: ResolvedThreadRef, sameRepo: boolean, expand: boolean) => string | undefined
}

export function sameRepo(a: RepoRef, b: RepoRef | undefined): boolean {
  return Boolean(b) && a.forge === b!.forge && a.instance === b!.instance
    && a.owner.toLowerCase() === b!.owner.toLowerCase() && a.name.toLowerCase() === b!.name.toLowerCase()
}

export function webUrlFor(web: WebLinks, target: UrlTarget): string | undefined {
  let path: string | undefined
  if ('repo' in target) {
    path = web.repo(target.repo)
  }
  else if ('thread' in target) {
    path = isResolvedThread(target.thread) ? web.thread(target.thread) : undefined
  }
  else if ('comment' in target) {
    const { comment } = target
    path = isResolvedThread(comment.thread) ? web.comment?.(comment as CommentRef & { thread: ResolvedThreadRef }) : undefined
  }
  else if ('release' in target) {
    path = web.release?.(target.release)
  }
  else if ('file' in target) {
    path = web.file?.(target.file.repo, target.file.path, target.file.at, target.file.line)
  }
  else {
    path = web.compare?.(target.compare.repo, target.compare.base, target.compare.head)
  }
  return path === undefined ? undefined : `${web.origin}${path}`
}

export function parseWebUrl(web: WebLinks, input: string | URL, origin: ForgeOrigin): ParsedForgeUrl | undefined {
  let url: URL
  try {
    url = new URL(input)
  }
  catch {
    return undefined
  }
  const base = new URL(web.origin)
  if (url.host !== base.host) {
    return undefined
  }
  const prefix = base.pathname.replace(/\/$/, '')
  if (prefix && !url.pathname.startsWith(`${prefix}/`)) {
    return undefined
  }
  const segments = url.pathname.slice(prefix.length).split('/').filter(Boolean).map(decodeURIComponent)
  return web.parse(segments, url, origin)
}

export function referenceFor(web: WebLinks | undefined, ref: ThreadRef, options: ReferenceOptions = {}): string | undefined {
  if (!web || !isResolvedThread(ref)) {
    return undefined
  }
  return web.reference?.(ref, sameRepo(ref.repo, options.from), options.expand ?? false) ?? webUrlFor(web, { thread: ref })
}

/** Reads `url` with whichever of `providers` serves it. */
export function parseForgeUrl(url: string | URL, providers: ReadonlyArray<{ parseUrl: (url: string | URL) => ParsedForgeUrl | undefined }>): ParsedForgeUrl | undefined {
  for (const provider of providers) {
    const parsed = provider.parseUrl(url)
    if (parsed) {
      return parsed
    }
  }
  return undefined
}
