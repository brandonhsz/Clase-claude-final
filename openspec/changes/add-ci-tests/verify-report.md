# Verify Report: CI Unit Tests on GitHub Actions

**Date**: 2026-09-12
**Result**: PASS (static verification). One requirement is only fully provable after the first run on GitHub — see Residual below.

## Baseline

`pnpm test` before the change:

```
Test Files  13 passed (13)
     Tests  101 passed (101)
  Duration  3.91s
```

Green baseline recorded, so a red first CI run would unambiguously indicate a CI defect, not a test defect.

## Spec Conformance

| Requirement | Evidence | Result |
|---|---|---|
| Unit Test Workflow Triggers | Parsed `on` → `{'push': {'branches': ['main']}, 'pull_request': {'branches': ['main']}}`. No `schedule`, `tags`, or wildcard branches. File at `.github/workflows/tests.yml`, `name: Unit Tests`. | PASS |
| Reproducible Dependency Installation | `pnpm/action-setup@v4` at step index 1 with `version: 10.33.0`; `actions/setup-node@v4` at index 2 with `node-version: 24`, `cache: pnpm`. Ordering assertion `1 < 2` evaluated True. Install step is `pnpm install --frozen-lockfile`. | PASS |
| Unit Test Execution and Result Reporting | Final step `run: pnpm test`, verbatim, no added flags. `package.json` maps `test` → `vitest run` (non-watch), so the process terminates and its exit status becomes the job conclusion. | PASS |

## Design Conformance

| Decision | Result |
|---|---|
| D1 pnpm pinned in workflow, `package.json` untouched | PASS — `git status` shows no modification to `package.json` |
| D2 pnpm step precedes Node step | PASS — asserted programmatically |
| D3 `--frozen-lockfile` | PASS |
| D4 `pnpm test`, no bespoke vitest invocation | PASS |
| D5 No lint/build steps | PASS — five steps only |
| D6 Single OS, single Node version | PASS — `ubuntu-latest`, `node-version: 24`, no matrix |
| D7 Least-privilege permissions | PASS — `permissions: {contents: read}` |
| Concurrency with cancel-in-progress | PASS — group `${{ github.workflow }}-${{ github.ref }}` |

## Checks Run

- YAML parses under `yaml.safe_load` — OK.
- Job/step structure enumerated: `test` → Checkout, Set up pnpm, Set up Node, Install dependencies, Run unit tests.
- Scope: `git status --porcelain` shows only `.github/` and `openspec/changes/add-ci-tests/` as new. No existing file modified.

## Residual

The "Push to an unrelated branch / does not trigger" and "Empty pnpm store cache" scenarios are provable only by observing GitHub's scheduler and cache on a real run. They follow directly from the parsed trigger configuration and from `setup-node` cache semantics, but the first push to `main` is the empirical confirmation.

**Archive is therefore deferred** until the workflow has completed at least one successful run on GitHub.
