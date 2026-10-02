# Forgejo fixtures

Every fixture here is hand-authored from the public Forgejo and Gitea Swagger
documentation rather than recorded, because no credential was available in this
worktree. Refresh them with `pnpm record-fixtures` once a token is present.

Values are deliberately distinct: notification ids are `551x`, thread numbers
are `7` and `9`, comment ids are `88000x`, timeline ids are `7701xx`.

The write fixtures (`write-*.json`) are hand-authored; the recording script
only performs reads.
