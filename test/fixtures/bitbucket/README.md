# Bitbucket Cloud fixtures

Every fixture here is hand-authored from the Bitbucket Cloud REST API 2.0
documentation. `api.bitbucket.org` was not reachable from the environment
that wrote them. Run `pnpm record-fixtures bitbucket` to record real reads into
`recorded/`.

Pull request activity is paginated with `next` in the body and returned
newest first, as Bitbucket does; the provider sorts events oldest first.

Values are deliberately distinct: the pull request id is `31`, comment ids are
`4400xx`, and repository and user UUIDs all differ.
