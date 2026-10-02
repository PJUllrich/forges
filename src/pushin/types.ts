/** Payloads served by pushin.eu `/api/v1`. Ids are opaque strings. */

export interface PushinUser {
  id: string
  login: string
  type?: string
  name?: string | null
  company?: string | null
  avatar_url?: string
  html_url?: string
}

export interface PushinRepository {
  id: string
  name: string
  full_name: string
  owner?: PushinUser | null
  private?: boolean
  visibility?: string
  description?: string | null
  homepage?: string | null
  default_branch?: string
  html_url?: string
  clone_url?: string
  topics?: string[]
  created_at?: string
  updated_at?: string
  forks_count?: number
  stargazers_count?: number
  watchers_count?: number
  permissions?: { admin?: boolean, maintain?: boolean, push?: boolean, triage?: boolean, pull?: boolean }
}

export interface PushinComment {
  id: string
  user?: PushinUser | null
  body: string
  created_at?: string
  updated_at?: string
  /** Set on a reply; pushin.eu threads comments. */
  in_reply_to_id?: string | null
}

export interface PushinLabel {
  id: string
  name: string
  description?: string | null
  /** A colour name such as `purple`, not a hex triplet. */
  color?: string | null
  default?: boolean
}

export interface PushinCollaborator extends PushinUser {
  role_name?: string
  permissions?: { admin?: boolean, maintain?: boolean, push?: boolean, triage?: boolean, pull?: boolean }
}

/** Inferred from the repository and comment payloads; unverified against a live pull request. */
export interface PushinPullRequest {
  id: string
  number: number
  title: string
  body?: string | null
  state?: string
  draft?: boolean
  locked?: boolean
  user?: PushinUser | null
  assignees?: PushinUser[]
  labels?: PushinLabel[]
  html_url?: string
  created_at?: string
  updated_at?: string
  closed_at?: string | null
  merged_at?: string | null
  comments?: number
  head?: { ref?: string, sha?: string } | null
  base?: { ref?: string, sha?: string } | null
}
