import type { Actor, Collaborator, Comment, ForgeOrigin, Label, Repo, RepoPermissions, RepoRef, RepoRole, ResolvedThreadRef, Thread, ThreadRef } from '../model.ts'
import type { PushinCollaborator, PushinComment, PushinLabel, PushinPullRequest, PushinRepository, PushinUser } from './types.ts'
import { toDate } from '../utils.ts'

export const FORGE = 'pushin'

export function toActor(origin: ForgeOrigin, user: PushinUser | undefined | null): Actor | undefined {
  if (!user) {
    return undefined
  }
  return {
    ...origin,
    login: user.login,
    id: user.id,
    name: user.name ?? undefined,
    avatarUrl: user.avatar_url,
    url: user.html_url,
    typeRaw: user.type,
    isBotHint: user.type === 'Bot',
  }
}

export function toRepoRef(origin: ForgeOrigin, raw: PushinRepository): RepoRef {
  const [owner, name] = raw.full_name.split('/')
  return {
    ...origin,
    owner: raw.owner?.login ?? owner ?? '',
    name: raw.name ?? name ?? '',
    externalId: raw.id,
  }
}

export function toRepo(origin: ForgeOrigin, raw: PushinRepository): Repo {
  const visibility = raw.visibility === 'private' || raw.private ? 'private' : 'public'
  return {
    ref: toRepoRef(origin, raw),
    description: raw.description ?? undefined,
    defaultBranch: raw.default_branch,
    visibility,
    visibilityRaw: raw.visibility,
    isFork: false,
    isArchived: false,
    topics: raw.topics ?? [],
    url: raw.html_url,
    cloneUrls: raw.clone_url ? { https: raw.clone_url } : undefined,
    createdAt: toDate(raw.created_at),
    updatedAt: toDate(raw.updated_at),
    permissions: toPermissions(raw.permissions),
    raw,
  }
}

/** pushin.eu label colours are names (`purple`), not hex. */
export function toLabel(raw: PushinLabel): Label {
  return { name: raw.name, description: raw.description ?? undefined }
}

type RawPermissions = PushinRepository['permissions']

function toPermissions(raw: RawPermissions): RepoPermissions | undefined {
  return raw && {
    admin: raw.admin ?? false,
    maintain: raw.maintain ?? false,
    push: raw.push ?? false,
    triage: raw.triage ?? false,
    pull: raw.pull ?? false,
  }
}

export function toRole(raw: PushinCollaborator): RepoRole {
  const permissions = raw.permissions ?? {}
  if (permissions.admin) {
    return 'admin'
  }
  if (permissions.maintain) {
    return 'maintain'
  }
  if (permissions.push) {
    return 'write'
  }
  if (permissions.triage) {
    return 'triage'
  }
  return permissions.pull ? 'read' : 'none'
}

export function toCollaborator(origin: ForgeOrigin, raw: PushinCollaborator): Collaborator {
  return {
    actor: toActor(origin, raw)!,
    role: toRole(raw),
    roleRaw: raw.role_name,
    permissions: toPermissions(raw.permissions),
    raw,
  }
}

export function toComment(thread: ThreadRef, raw: PushinComment): Comment {
  return {
    ref: { forge: FORGE, instance: thread.instance, thread, id: raw.id },
    body: raw.body,
    author: toActor({ forge: FORGE, instance: thread.instance }, raw.user),
    createdAt: toDate(raw.created_at),
    updatedAt: toDate(raw.updated_at),
    raw,
  }
}

export function toPullThread(ref: ResolvedThreadRef, raw: PushinPullRequest): Thread {
  const origin = { forge: FORGE, instance: ref.instance }
  const state = raw.merged_at || raw.state === 'closed' || raw.state === 'merged' ? 'closed' : 'open'
  return {
    ref: { ...ref, externalId: raw.id },
    kind: 'pull_request',
    title: raw.title,
    body: raw.body ?? undefined,
    state,
    stateRaw: raw.merged_at ? 'merged' : raw.state,
    isDraft: raw.draft ?? false,
    author: toActor(origin, raw.user),
    assignees: (raw.assignees ?? []).flatMap(user => toActor(origin, user) ?? []),
    reviewers: [],
    labels: (raw.labels ?? []).map(toLabel),
    url: raw.html_url,
    createdAt: toDate(raw.created_at),
    updatedAt: toDate(raw.updated_at),
    closedAt: toDate(raw.closed_at ?? undefined),
    lastActivityAt: toDate(raw.updated_at),
    locked: raw.locked,
    commentCount: raw.comments,
    branches: raw.head || raw.base
      ? { head: { ref: raw.head?.ref ?? '', sha: raw.head?.sha }, base: { ref: raw.base?.ref ?? '' } }
      : undefined,
    raw,
  }
}
