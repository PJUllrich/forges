import type { ProviderContext, ProviderDefinition, ProviderFactoryFunction, ProviderSpec } from '../define.ts'
import type { Comment, Cursor, ForgeEventInput, ListOptions, Page, RepoRef, ResolvedThreadRef, Thread, ThreadQuery, ThreadRef } from '../model.ts'
import type { AnonymousAuth, ForgeOptionsBase, TokenAuth, VerbScopes } from '../provider.ts'
import type { ForgeVerb } from '../supports.ts'
import type { PushinCollaborator, PushinComment, PushinLabel, PushinPullRequest, PushinRepository } from './types.ts'
import { defineForgeProvider, perKind, verb } from '../define.ts'
import { UnsupportedOperationError } from '../errors.ts'
import { createListing, getManyConcurrently, requireThread, toPage } from '../utils.ts'
import { githubShapedWeb } from '../web.ts'
import { FORGE, toActor, toCollaborator, toComment, toLabel, toPullThread, toRepo } from './normalise.ts'

/** A personal access token created in Settings (`pun_pat_…`), sent as `Authorization: Bearer`. */
export type PushinAuth = TokenAuth | AnonymousAuth

export interface PushinOptions extends ForgeOptionsBase {
  /** Defaults to `{ type: 'anonymous' }`: public repository reads only. */
  auth?: PushinAuth
  /** Instance root. Defaults to `https://pushin.eu`; `/api/v1` is appended. */
  baseUrl?: string
}

function setupPushin({ instance, origin: context, fetcher, baseUrl }: ProviderContext<PushinOptions, undefined>): ProviderSpec {
  const list = createListing(fetcher, 'per_page')
  const repoPath = (repo: RepoRef) => `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`

  function requirePull(thread: ThreadRef, action: string): ResolvedThreadRef {
    const ref = requireThread(thread, context)
    if (ref.kind !== 'pull_request') {
      throw new UnsupportedOperationError(`pushin.eu has no API to ${action} an ${ref.kind === 'issue' ? 'issue' : ref.kind}`, context)
    }
    return ref
  }

  /** Issue and pull comments are the only thread content the API serves; both hang off the thread's number. */
  function commentsPath(ref: ResolvedThreadRef): string {
    return `${repoPath(ref.repo)}/${ref.kind === 'pull_request' ? 'pulls' : 'issues'}/${encodeURIComponent(ref.number)}/comments`
  }

  async function get(thread: ThreadRef): Promise<Thread> {
    const ref = requirePull(thread, 'read')
    const { data } = await fetcher.json<PushinPullRequest>(`${repoPath(ref.repo)}/pulls/${encodeURIComponent(ref.number)}`)
    return toPullThread(ref, data)
  }

  async function listPage(repo: RepoRef, query: ThreadQuery = {}): Promise<Page<Thread>> {
    if (query.kind && query.kind !== 'pull_request') {
      return { items: [], warnings: [{ code: 'kind_unsupported', message: `pushin.eu has no listing for ${query.kind}s` }] }
    }
    const result = await fetcher.page<PushinPullRequest>(`${repoPath(repo)}/pulls`, {
      query: { state: query.state === 'all' ? undefined : query.state, per_page: query.perPage },
      cursor: query.cursor,
      signal: query.signal,
    })
    return toPage(result, raw => toPullThread({ forge: FORGE, instance, repo, kind: 'pull_request', number: String(raw.number) }, raw))
  }

  async function commentsPage(thread: ThreadRef, listOptions: ListOptions = {}): Promise<Page<Comment>> {
    const ref = requireThread(thread, context)
    const result = await fetcher.page<PushinComment>(commentsPath(ref), {
      query: { per_page: listOptions.perPage },
      cursor: listOptions.cursor,
      signal: listOptions.signal,
    })
    return toPage(result, raw => toComment(ref, raw))
  }

  /** The only timeline the API serves is the comment listing, so events are comments and nothing else. */
  async function eventsPage(thread: ThreadRef, listOptions: ListOptions = {}): Promise<Page<ForgeEventInput>> {
    const ref = requireThread(thread, context)
    const page = await commentsPage(ref, listOptions)
    return {
      ...page,
      items: page.items.map(comment => ({
        forge: FORGE,
        instance,
        id: comment.ref.id,
        kind: 'comment' as const,
        kindRaw: 'comment',
        summary: `${comment.author?.login ?? 'someone'} commented`,
        occurredAt: comment.createdAt ?? new Date(0),
        actor: comment.author,
        repo: ref.repo,
        thread: ref,
        source: 'poll' as const,
        detail: { type: 'comment' as const, comment: comment.ref, body: comment.body },
        payload: comment.raw,
      })),
    }
  }

  async function labelsPage(repo: RepoRef, listOptions: ListOptions = {}): Promise<Page<ReturnType<typeof toLabel>>> {
    const result = await fetcher.page<PushinLabel>(`${repoPath(repo)}/labels`, {
      query: { per_page: listOptions.perPage },
      cursor: listOptions.cursor,
      signal: listOptions.signal,
    })
    return toPage(result, toLabel)
  }

  return {
    traits: {
      poll: false,
      eventKinds: 'native',
      auth: ['token', 'anonymous'],
    },
    repos: {
      get: verb(true, async repo => toRepo({ forge: FORGE, instance }, (await fetcher.json<PushinRepository>(repoPath(repo))).data)),
      listPage: verb('experimental', (listOptions = {}) => list('/user/repos', listOptions, (raw: PushinRepository) => toRepo({ forge: FORGE, instance }, raw))),
      labelsPage: verb(true, labelsPage),
      collaboratorsPage: verb('experimental', (repo, listOptions = {}) => list(`${repoPath(repo)}/collaborators`, listOptions, (raw: PushinCollaborator) => toCollaborator({ forge: FORGE, instance }, raw))),
    },
    threads: {
      get: perKind({ pull_request: 'experimental' }, get),
      listPage: perKind({ pull_request: 'experimental' }, listPage),
      getMany: verb(true, refs => getManyConcurrently(refs, get)),
      eventsPage: verb('emulated', eventsPage),
      commentsPage: perKind({ issue: true, pull_request: 'experimental' }, commentsPage),
    },
    web: githubShapedWeb(baseUrl.replace(/\/api\/v1$/, ''), {
      pull: 'pulls',
      commentFragment: 'comment-',
      file: at => `/blob/${encodeURIComponent(at)}`,
      lineFragment: line => `L${line}`,
    }),
    webhooks: {},
    scopes: pushinScopesFor,
  }
}

const PUSHIN: ProviderDefinition<PushinOptions> = {
  kind: FORGE,
  experimental: true,
  anonymous: true,
  baseUrl: 'https://pushin.eu',
  apiPath: '/api/v1',
  headers: { accept: 'application/vnd.github+json' },
  authHeaders: ({ options: { auth } }) => auth?.type === 'token' ? () => ({ authorization: `Bearer ${auth.token}` }) : undefined,
  setup: setupPushin,
}

/** Creates a pushin.eu provider. Only repositories, labels, collaborators, pull requests and comments are served. */
export const pushin: ProviderFactoryFunction<PushinOptions> = /* @__PURE__ */ defineForgeProvider(PUSHIN)

/** pushin.eu issues one personal access token with no scope selection. */
export function pushinScopesFor(_verb: ForgeVerb): VerbScopes {
  return { note: 'A personal access token created in Settings; pushin.eu does not scope tokens per resource' }
}

export { toActor as toPushinActor, toComment as toPushinComment, toRepo as toPushinRepo }
export type { Cursor }
