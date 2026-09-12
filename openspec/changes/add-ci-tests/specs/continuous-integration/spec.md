# Delta for Continuous Integration

## ADDED Requirements

### Requirement: Unit Test Workflow Triggers

The repository MUST define a GitHub Actions workflow that runs the unit test suite automatically. The workflow MUST trigger on `push` to the `main` branch and on `pull_request` targeting `main`. It MUST NOT trigger on tags, schedules, or pushes to other branches, so that the only automatic runs are those that gate `main` directly or through review.

The workflow MUST be discoverable at `.github/workflows/tests.yml` and MUST declare a human-readable `name` so it is identifiable in the GitHub checks UI.

#### Scenario: Pull request opened against main

- GIVEN a pull request whose base branch is `main`
- WHEN the pull request is opened or updated with new commits
- THEN the workflow MUST run and report its status as a check on that pull request

#### Scenario: Direct push to main

- GIVEN a commit pushed directly to `main`
- WHEN the push completes
- THEN the workflow MUST run against that commit

#### Scenario: Push to an unrelated branch

- GIVEN a commit pushed to a branch other than `main` with no open pull request
- WHEN the push completes
- THEN the workflow MUST NOT run

### Requirement: Reproducible Dependency Installation

The workflow MUST install dependencies reproducibly. It MUST use pnpm pinned to the version recorded in `openspec/config.yaml` (10.33.0) and Node pinned to the major version recorded there (24). It MUST install with `--frozen-lockfile`, so a `pnpm-lock.yaml` that does not satisfy `package.json` fails the run instead of resolving fresh versions.

pnpm MUST be installed before the Node setup step, because the Node setup step's pnpm store caching resolves the store path by invoking the pnpm binary. The pnpm store SHOULD be cached between runs to reduce install time; a cache miss MUST NOT fail the run.

#### Scenario: Lockfile satisfies package.json

- GIVEN `pnpm-lock.yaml` is in sync with `package.json`
- WHEN the install step runs
- THEN dependencies MUST install from the lockfile and the step MUST succeed

#### Scenario: Lockfile drifted from package.json

- GIVEN a dependency was added to `package.json` without updating `pnpm-lock.yaml`
- WHEN the install step runs
- THEN the step MUST fail and the workflow MUST report failure

#### Scenario: Empty pnpm store cache

- GIVEN no pnpm store cache exists for this repository
- WHEN the workflow runs
- THEN the install step MUST still succeed by downloading packages

### Requirement: Unit Test Execution and Result Reporting

The workflow MUST run the project's existing test command, `pnpm test`, unchanged. It MUST NOT define its own runner invocation, flags, or file globs, so that the command executed in CI is the same one a developer runs locally.

The workflow's conclusion MUST reflect the test suite's exit status: a non-zero exit MUST fail the workflow, and a zero exit MUST pass it. The command MUST run in non-watch mode so the process terminates.

#### Scenario: All unit tests pass

- GIVEN every test file under `src/` passes
- WHEN the test step runs
- THEN the step MUST exit zero and the workflow MUST be reported as successful

#### Scenario: A unit test fails

- GIVEN at least one test file under `src/` fails
- WHEN the test step runs
- THEN the step MUST exit non-zero and the workflow MUST be reported as failed

#### Scenario: Test command does not hang

- GIVEN the workflow runs on a CI runner with no TTY
- WHEN the test step runs
- THEN the test process MUST terminate on its own without waiting for file changes or manual input
