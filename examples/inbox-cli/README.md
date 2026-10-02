# `inbox-cli`

A command-line inbox that prints the notifications from every forge you configure. It prints one line per notification, newest first.

The CLI reads providers from the `FORGES_<KIND>_<FIELD>` environment variables, with `providersFromEnv()` from `forges/env`. Some providers can't list notifications, such as Bitbucket, Azure DevOps, and Cursor Origin. For those providers, the CLI lists the open threads in the repository that you set in `FORGES_<KIND>_DEMO_REPO`. Provider warnings go to stderr.

## Run it

```sh
FORGES_GITHUB_TOKEN=ghp_... \
FORGES_BITBUCKET_USERNAME=me FORGES_BITBUCKET_PASSWORD=app-password \
FORGES_BITBUCKET_DEMO_REPO=acme/widgets \
pnpm --filter @forges-examples/inbox-cli start
```

```
github:github.com:notification/901234567  2025-09-18 09:12  github  acme/widgets  pull_request  review_requested  Add retry handling to the uploader
```

The first column is the key of the row. To mark a notification done, pass its key to `--done`:

```sh
pnpm --filter @forges-examples/inbox-cli start -- --done github:github.com:notification/901234567
```

On a forge that has only a read state, `--done` marks the notification read.

## Run the tests

```sh
pnpm --filter @forges-examples/inbox-cli test
```

The tests run the real providers against the fixtures in `test/fixtures/`, without a network connection.
