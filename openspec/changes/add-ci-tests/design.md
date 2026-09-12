# Design: CI Unit Tests on GitHub Actions

## Context

Verified state of the repository before this change:

| Fact | Evidence |
|------|----------|
| No CI exists | `.github/` does not exist |
| 13 test files | `src/features/kanban/**/*.test.ts(x)` |
| Runner already wired | `vite.config.ts` — `vitest/config`, `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']` |
| Test script exists | `package.json` — `"test": "vitest run"` |
| No `packageManager` field | `package.json` has no such key |
| Toolchain | pnpm 10.33.0, Node 24.14.0, lockfile v9 (`openspec/config.yaml`, `pnpm-lock.yaml`) |

So the only missing piece is the workflow file itself. No test, config, or dependency change is needed.

## Sequence

```
GitHub event (push to main | PR -> main)
  |
  v
[ actions/checkout@v4 ]          working tree at the event's commit
  |
  v
[ pnpm/action-setup@v4 ]         pnpm 10.33.0 on PATH      <-- MUST precede setup-node
  |
  v
[ actions/setup-node@v4 ]        Node 24 + cache: 'pnpm'
  |                              (runs `pnpm store path` to locate the cache dir)
  v
[ pnpm install --frozen-lockfile ]
  |
  v
[ pnpm test ]  ->  vitest run  ->  exit 0 | exit 1
  |
  v
job conclusion = test exit status
```

## Decisions

### D1 — pnpm version pinned in the workflow, not via `packageManager`

`pnpm/action-setup` resolves its version from `packageManager` in `package.json` when no `version` input is given. That field is absent here. Two ways to close the gap:

- **Chosen**: pass `version: 10.33.0` to the action.
- **Rejected**: add `"packageManager": "pnpm@10.33.0"` to `package.json`.

The rejected option is arguably the better long-term convention — it makes Corepack enforce the same version locally — but it mutates `package.json`, which is application-facing and outside the scope this proposal declared. Pinning in the workflow keeps this change confined to `.github/`. If the project later adopts `packageManager`, the `version` input is deleted and the action reads the field instead.

### D2 — Step order: pnpm before Node

`actions/setup-node` with `cache: 'pnpm'` determines what to cache by executing `pnpm store path`. If pnpm is not yet installed, that step fails with `Unable to locate executable file: pnpm`. This ordering is the single most common failure in pnpm-on-Actions setups, and it is load-bearing here, not stylistic.

### D3 — `--frozen-lockfile` rather than a plain install

A plain `pnpm install` will happily resolve a dependency that exists in `package.json` but not in the lockfile, so CI would test a dependency tree that no developer has. `--frozen-lockfile` turns that drift into a failed run. (pnpm defaults this to true in CI, but stating it explicitly makes the intent readable and independent of environment detection.)

### D4 — `pnpm test`, not a bespoke vitest invocation

Calling `pnpm test` means CI and local runs execute the same command. A hand-written `npx vitest run --coverage ...` in the workflow would drift from `package.json` the moment either side changes. `vitest run` is already non-watch, so nothing hangs on a runner without a TTY.

### D5 — Tests only; lint and build are not steps

The request was unit tests. `pnpm build` runs `tsc -b` and would turn a type error into a CI failure, and `pnpm lint` would gate on oxlint — both defensible, both outside the stated scope, and both decisions the maintainer should make deliberately rather than inherit from a test workflow. Adding them later is a two-line change.

### D6 — Single Node version, single OS

Matrix builds multiply run time and cost. This is a browser-targeted app bundled by Vite; the Node version only affects the toolchain, and the project has already pinned one (24.14.0). `ubuntu-latest` alone is proportional.

### D7 — Explicit least-privilege permissions

`permissions: contents: read` is declared at workflow level. The job only checks out code and runs tests; it needs no write token. Declaring it prevents inheriting a broader default from repository or organization settings.

## Concurrency

`concurrency` with `cancel-in-progress: true`, keyed on the workflow and ref, stops a stale run when a pull request is force-pushed or amended. This saves runner minutes and avoids a superseded red check confusing the PR view. It is safe here because the job has no side effects — it only reads and runs tests.

## Verification Plan

1. `pnpm test` locally — the suite must be green before wiring CI, otherwise a red first run is ambiguous between "CI is broken" and "tests are broken".
2. YAML parses (`ruby -ryaml` / `python3 -c 'import yaml'` or equivalent).
3. Confirm step ordering (pnpm before setup-node) by reading the committed file.
