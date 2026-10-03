/** True for a full 40-character commit sha, which needs no lookup to resolve. */
export function isSha(ref: string): boolean {
  return /^[0-9a-f]{40}$/i.test(ref)
}
