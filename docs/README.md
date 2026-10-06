# forges docs

The documentation site for `forges`, built with [Docus](https://docus.dev).

```sh
pnpm --filter forges-docs dev
pnpm --filter forges-docs build
pnpm test:docs
```

- `content/` holds the pages, grouped as getting started, guides, concepts, providers, reference, examples and contributing.
- `content/index.md` renders the landing page from `app/components/content/LandingPage.vue`. Its parts live in `app/components/landing/`.
- `app/components/app/AppHeader.vue` copies the Docus header to add the npmx link, and `app/components/app/AppFooter.vue` copies the Docus footer to add the documentation links.
- `content/developers.md` is the developer portal at `/developers`. `navigation: false` keeps it out of the sidebar.
- `server/mcp/resources/` holds the MCP resources served at `/mcp`, next to the `list-pages` and `get-page` tools from Docus.
- The tests in `test/` run against the build in `.output`. Build the docs before you run them. They run as the `docs` project in the root `vitest.config.ts`.
- The provider pages and `content/5.reference/2.capability-matrix.md` hold generated capability tables. Run `pnpm capability-matrix` from the repository root after you change a provider.
