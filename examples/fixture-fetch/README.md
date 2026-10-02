# `@forges-examples/fixture-fetch`

A private workspace package that the example tests share. It exports a `fetch` that serves the JSON fixtures in `test/fixtures/<forge>/`, so the tests run without a network connection:

```ts
import { fixtureFetch } from '@forges-examples/fixture-fetch'

const { fetch, calls } = fixtureFetch(['github'], {
  'GET https://api.github.com/repos/acme/widgets/collaborators/grace/permission': {
    status: 200,
    body: { permission: 'write' },
  },
})
```

- The first argument lists the forges whose fixtures to load.
- The second argument adds or replaces responses. Each key is `METHOD url`. For a GraphQL request, the key ends with the operation name.
- `calls` records every request that the providers make. A test can use it to assert that a capability check prevented a write.

For your own tests, use `fixtureFetch()` and `loadFixtures()` from `forges/testing`.
