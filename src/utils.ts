import type { ForgeErrorContext } from './errors.ts'
import type { FetchResult } from './fetch.ts'
import type { ChecksSummary, CheckState, Cursor, ForgeWarning, GetManyResult, ListOptions, Page, RateLimit, ResolvedThreadRef, Thread, ThreadRef } from './model.ts'
import type { ForgeIterable } from './provider.ts'
import { ForgeApiError, UnresolvedThreadError } from './errors.ts'
import { rateLimitOf } from './fetch.ts'
import { isResolvedThread } from './model.ts'

/**
 * Wraps a generator so warnings it reports are collected on the returned
 * iterable rather than interrupting iteration.
 */
export function forgeIterable<T>(run: (warn: (warning: ForgeWarning) => void) => AsyncIterable<T>): ForgeIterable<T> {
  const warnings: ForgeWarning[] = []
  return {
    warnings,
    [Symbol.asyncIterator]: () => run(warning => warnings.push(warning))[Symbol.asyncIterator](),
  }
}

/** Drives a `page()` function until it reports no further cursor, collecting page warnings. */
export function iteratePages<T, O extends { cursor?: Cursor } = ListOptions>(
  page: (options: O) => Promise<Page<T>>,
  options: O = {} as O,
): ForgeIterable<T> {
  return forgeIterable(async function* (warn) {
    let cursor: Cursor | undefined = options.cursor
    while (true) {
      const result: Page<T> = await page({ ...options, cursor })
      result.warnings?.forEach(warn)
      yield* result.items
      if ((!result.cursor?.nextUrl && !result.cursor?.token) || result.notModified) {
        return
      }
      cursor = result.cursor
    }
  })
}

/** Turns a caught error into a serialisable warning. */
export function toWarning(code: string, error: unknown, subject?: string): ForgeWarning {
  const err = error instanceof Error ? error : new Error(String(error))
  return {
    code,
    message: err.message,
    subject,
    cause: { name: err.name, message: err.message, status: err instanceof ForgeApiError ? err.status : undefined },
  }
}

/** Maps with at most `limit` calls in flight, preserving order. */
export async function mapConcurrent<T, R>(items: readonly T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await fn(items[index]!)
    }
  }))
  return results
}

/** `threads.getMany` for forges without a batch endpoint. */
export function getManyConcurrently(
  refs: ThreadRef[],
  get: (ref: ThreadRef) => Promise<Thread>,
  limit = 4,
): Promise<GetManyResult[]> {
  return mapConcurrent(refs, limit, ref => get(ref).then(
    thread => ({ ok: true, ref, thread }),
    (error: unknown) => ({ ok: false, ref, warning: toWarning(error instanceof UnresolvedThreadError ? 'thread_unresolved' : 'thread_unreadable', error, ref.number) }),
  ))
}

/** Compares dotted numeric versions, ignoring any suffix after the numbers. */
export function versionAtLeast(version: string | undefined, minimum: string): boolean {
  if (!version) {
    return false
  }
  const parts = (value: string) => (/^\D*(\d+(?:\.\d+)*)/.exec(value)?.[1] ?? '0').split('.').map(Number)
  const [a, b] = [parts(version), parts(minimum)]
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0)
    if (difference !== 0) {
      return difference > 0
    }
  }
  return true
}

export function toDate(value: string | number | null | undefined): Date | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function hostOf(baseUrl: string): string {
  return new URL(baseUrl).host
}

/** Narrows a ref to one a provider can address, or throws {@link UnresolvedThreadError}. */
export function requireThread(ref: ThreadRef, context?: ForgeErrorContext): ResolvedThreadRef {
  if (ref.kind === 'other' || !isResolvedThread(ref)) {
    throw new UnresolvedThreadError(
      ref.kind === 'other'
        ? `${ref.typeRaw ?? 'This'} subject has no thread API`
        : 'Thread ref has no number; resolve it before calling the forge',
      context ?? { forge: ref.forge, instance: ref.instance },
    )
  }
  return ref
}

/** Maps one fetched page into a {@link Page}. The cursor is kept only when there is a next page. */
export function toPage<R, T>(result: FetchResult<R[]>, map: (raw: R) => T | undefined, warnings?: ForgeWarning[]): Page<T> {
  return {
    items: (result.data ?? []).flatMap((raw) => {
      const item = map(raw)
      return item === undefined ? [] : [item]
    }),
    cursor: result.cursor?.nextUrl || result.cursor?.token ? result.cursor : undefined,
    notModified: result.notModified || undefined,
    ...warnings?.length ? { warnings } : {},
    ...rateLimitPart(result.response),
  }
}

function rateLimitPart(response: Response | undefined): { rateLimit?: RateLimit } {
  const rateLimit = response && rateLimitOf(response)
  return rateLimit ? { rateLimit } : {}
}

/**
 * Chains listings that a forge serves from separate endpoints. The cursor
 * `token` records which phase is next, ahead of the phase's own token.
 */
export async function phased<T>(phases: Array<(cursor?: Cursor) => Promise<Page<T>>>, cursor?: Cursor): Promise<Page<T>> {
  const match = /^(\d+):(.*)$/s.exec(cursor?.token ?? '')
  const index = match ? Number(match[1]) : 0
  const inner = cursor && (cursor.nextUrl || match?.[2]) ? { ...cursor, token: match?.[2] || undefined } : undefined
  const page = await phases[index]!(inner)
  if (page.cursor) {
    return { ...page, cursor: { ...page.cursor, token: `${index}:${page.cursor.token ?? ''}` } }
  }
  return index + 1 < phases.length ? { ...page, cursor: { token: `${index + 1}:` } } : page
}

/** Summarises individual check states: any failure fails, else any pending is pending, else success. */
export function summariseChecks(states: CheckState[], url?: string): ChecksSummary {
  const failed = states.filter(state => state === 'failure').length
  const state = failed
    ? 'failure'
    : states.includes('pending')
      ? 'pending'
      : states.length ? 'success' : 'unknown'
  return { state, total: states.length, failed, ...url ? { url } : {} }
}
