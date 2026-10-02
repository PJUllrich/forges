import process from 'node:process'
import { fromEnv } from './env.ts'
import { collectInbox, formatRow, markDone } from './inbox.ts'

const args = process.argv.slice(2)
const doneIndex = args.indexOf('--done')
const { forges, repos, warnings: envWarnings } = fromEnv(process.env)

if (forges.providers.length === 0) {
  process.stderr.write('No providers configured. Set FORGES_GITHUB_TOKEN or any other FORGES_* variable.\n')
  process.exit(1)
}

for (const warning of envWarnings) {
  process.stderr.write(`warning: ${warning.code}: ${warning.message}\n`)
}

if (doneIndex !== -1) {
  const key = args[doneIndex + 1]
  if (!key) {
    process.stderr.write('--done needs a key, as shown in the first column of the inbox.\n')
    process.exit(1)
  }
  const result = await markDone(forges, key, { repos })
  process.stdout.write(`${result.verb} ${result.key} on ${result.forge}\n`)
}
else {
  const { rows, warnings } = await collectInbox(forges, { repos })
  for (const row of rows) {
    process.stdout.write(`${row.key}  ${formatRow(row)}\n`)
  }
  for (const warning of warnings) {
    process.stderr.write(`warning: ${warning.code}: ${warning.message}\n`)
  }
}
