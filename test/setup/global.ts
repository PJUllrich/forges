import { rmSync } from 'node:fs'

export function setup(): void {
  rmSync(new URL('../.verbs/', import.meta.url), { recursive: true, force: true })
}
