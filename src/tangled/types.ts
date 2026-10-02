export interface StrongRef {
  uri: string
  cid: string
}

export interface IssueRecord {
  $type?: 'sh.tangled.repo.issue'
  title: string
  body?: string
  /** Repo DID, or in older records the `sh.tangled.repo` AT-URI. */
  repo: string
  mentions?: string[]
  createdAt: string
}

export interface PullRecord {
  $type?: 'sh.tangled.repo.pull'
  title: string
  body?: string
  target: { repo: string, branch: string }
  source?: { repo?: string, branch: string }
  rounds?: Array<{ createdAt: string }>
  createdAt: string
}

export interface FeedCommentRecord {
  $type?: 'sh.tangled.feed.comment'
  body: { $type?: string, text?: string, original?: string } | string
  subject: StrongRef
  replyTo?: StrongRef
  createdAt: string
}

export interface LegacyCommentRecord {
  body: string
  issue?: string
  pull?: string
  replyTo?: string
  createdAt: string
}

export interface StateRecord {
  issue?: string
  pull?: string
  state?: string
  status?: string
  createdAt: string
}

export interface ReactionRecord {
  subject: string
  reaction: string
  createdAt: string
}

export interface LabelOpRecord {
  subject: string
  add: Array<{ key: string, value: string }>
  delete: Array<{ key: string, value: string }>
  performedAt: string
}

export type TangledRecord
  = | IssueRecord
    | PullRecord
    | FeedCommentRecord
    | LegacyCommentRecord
    | StateRecord
    | ReactionRecord
    | LabelOpRecord

export interface RecordResponse<T = TangledRecord> {
  uri: string
  cid?: string
  value: T
}

export interface DidDocument {
  id: string
  alsoKnownAs?: string[]
  service?: Array<{ id: string, type: string, serviceEndpoint: string }>
}

export interface BacklinksResponse {
  total?: number
  linking_records: Array<{ did: string, collection: string, rkey: string }>
  cursor?: string | null
}

export interface JetstreamCommitEvent {
  did: string
  time_us: number
  kind: 'commit'
  commit: {
    rev: string
    operation: 'create' | 'update' | 'delete'
    collection: string
    rkey: string
    record?: TangledRecord & { $type?: string }
    cid?: string
  }
}

export interface JetstreamOtherEvent {
  did: string
  time_us: number
  kind: 'identity' | 'account'
}

export type JetstreamEvent = JetstreamCommitEvent | JetstreamOtherEvent

export interface Session {
  did: string
  accessJwt: string
  refreshJwt: string
}

export interface RepoRecord {
  $type?: 'sh.tangled.repo'
  knot: string
  name?: string
  description?: string
  topics?: string[]
  source?: string
  website?: string
  repoDid?: string
  createdAt: string
}

export interface SubscriptionRecord {
  subject: { $type?: string, uri?: string, did?: string }
  createdAt: string
}
