# Proposal: CI Unit Tests on GitHub Actions

**OpenSpec exemption**: Not exempt — adds a new repository capability (automated verification on push and pull request). It adds no application behavior, but it is an addition, so it goes through the flow.

**Baseline note**: `openspec/specs/` is still empty (`.gitkeep` only); `add-kanban-board` is unarchived. This change introduces a new capability and amends nothing existing.

## Intent

The repository has 13 test files under `src/features/kanban/` and a working runner (`pnpm test` → `vitest run`, configured in `vite.config.ts`), but nothing runs them outside a developer's machine. There is no `.github/` directory. A regression reaches `main` unnoticed today. This change adds a GitHub Actions workflow that runs the existing unit test suite on every push to `main` and every pull request targeting it.

## Scope

### In Scope
- `.github/workflows/tests.yml` — single job, single OS, single Node version.
- Reproducible install: pnpm pinned to the version in `openspec/config.yaml`, `--frozen-lockfile`, pnpm store cached via `actions/setup-node`.
- Runs exactly the existing `pnpm test` script. No new test files, no changes to existing tests.

### Out of Scope
- Lint (`pnpm lint`) and build (`pnpm build`) as CI steps. The request was unit tests specifically; adding more gates is a separate decision.
- Coverage reporting and thresholds — `coverage_threshold` is `0` in `openspec/config.yaml` and no coverage provider is installed.
- Matrix builds across Node versions or operating systems.
- Branch protection rules (a GitHub repository setting, not a file in this repo).
- Deploy, release, or publish workflows.
- Adding a `packageManager` field to `package.json` (see design.md for the rejected alternative).

## Capabilities

### New Capabilities
- `continuous-integration` — automated execution of the unit test suite on push and pull request.

### Modified Capabilities
- None.

### Removed Capabilities
- None.

## Approach

One workflow file. `pnpm/action-setup@v4` installs pnpm **before** `actions/setup-node@v4`, because `cache: 'pnpm'` on setup-node needs the pnpm binary on PATH to resolve the store path. Install with `--frozen-lockfile` so a lockfile drifting from `package.json` fails CI instead of silently resolving new versions. Then `pnpm test`, which is already `vitest run` (non-watch), so it exits with a real status code.

## Risks and Rollback

| Risk | Mitigation |
|------|------------|
| pnpm version in CI drifts from local 10.33.0 | Version pinned explicitly in the workflow; `openspec/config.yaml` records the same value. |
| Lockfile out of sync with `package.json` | `--frozen-lockfile` fails loudly rather than resolving silently. |
| jsdom tests behaving differently on Linux runners | Suite is pure jsdom + Testing Library, no browser binaries or platform-specific APIs. Verified by running `pnpm test` locally before merge. |

**Rollback**: delete `.github/workflows/tests.yml`. Nothing in the application depends on it.
