# Tasks: CI Unit Tests on GitHub Actions

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~40 (one new workflow file) |
| 400-line budget risk | None |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

## Phase 1 — Baseline

- [x] 1.1 Run `pnpm test` locally and record the pass/fail count. A green baseline is required before CI is wired, so that a red first CI run is unambiguous.
- [x] 1.2 Confirm `.github/` does not already exist (avoid clobbering an unseen workflow).

## Phase 2 — Workflow

- [x] 2.1 Create `.github/workflows/tests.yml` with `name`, and triggers `push` on `main` plus `pull_request` on `main`.
- [x] 2.2 Declare workflow-level `permissions: contents: read` (D7).
- [x] 2.3 Declare `concurrency` keyed on workflow + ref with `cancel-in-progress: true`.
- [x] 2.4 Job on `ubuntu-latest`: `actions/checkout@v4`.
- [x] 2.5 Add `pnpm/action-setup@v4` with `version: 10.33.0`, positioned **before** the Node step (D2).
- [x] 2.6 Add `actions/setup-node@v4` with `node-version: 24` and `cache: 'pnpm'`.
- [x] 2.7 Add install step: `pnpm install --frozen-lockfile`.
- [x] 2.8 Add test step: `pnpm test`.

## Phase 3 — Verification

- [x] 3.1 Validate the file is well-formed YAML.
- [x] 3.2 Re-read the committed file and confirm pnpm precedes setup-node, and that the test step invokes `pnpm test` verbatim.
- [x] 3.3 Check each spec requirement against the file: triggers, reproducible install, test execution and result reporting.
- [x] 3.4 Confirm no file outside `.github/` and `openspec/` was modified.
