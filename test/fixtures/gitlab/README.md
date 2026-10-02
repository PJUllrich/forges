# GitLab fixtures

Every fixture here is hand-authored from the public GitLab REST API
documentation. gitlab.com was not reachable from the environment that wrote
them, so none has been checked against a live response yet. Run
`pnpm record-fixtures gitlab` to record real reads into `recorded/`.

The project lives in a nested group (`acme/platform/widgets`) so the namespace
handling is exercised. The page 2 to-do points at a group-level epic with no
project.

Values are deliberately distinct: to-do ids are `1029384xx`, merge request and
issue iids are `23` and `11`, the epic iid is `4`, note ids are `55500xx`,
and the project id is `278964`.
