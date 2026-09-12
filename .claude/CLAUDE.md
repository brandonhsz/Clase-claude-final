# Clase-final-claude

Project-level instructions for Claude Code. Keep this file short and factual —
it is loaded into context on every session.

## Workflow: OpenSpec is mandatory

**Every addition to this project must go through OpenSpec.** No feature,
component, dependency, route, or behavior change gets written straight to code.

Required order for any new work:

1. **Proposal** — state intent, scope, and approach before touching code.
2. **Spec** — capture requirements and scenarios as delta specs.
3. **Design** — record the technical approach and the tradeoffs rejected.
4. **Tasks** — break the change into an ordered, checkable list.
5. **Apply** — implement only what the tasks describe.
6. **Verify** — confirm the implementation matches spec, design, and tasks.
7. **Archive** — merge delta specs into the main specs and close the change.

Do not skip ahead. Do not implement first and backfill the spec afterwards —
a spec written after the code documents what happened, not what was decided.

### Exempt from the flow

Only changes that add no behavior: typo and formatting fixes, dependency
version bumps with no API change, and edits to this file.

### When asked to add something

If the user asks for a feature without an OpenSpec change in flight, open the
proposal first and say so. Do not start writing code and ask for forgiveness.

## Overview

Single-page React application scaffolded with Vite. Starting point for the final class project.

## Tech stack

- React 19 + TypeScript 6
- Vite 8 (dev server and bundler), `@vitejs/plugin-react`
- oxlint for linting
- pnpm as package manager

## Commands

| Task    | Command        |
| ------- | -------------- |
| Install | `pnpm install` |
| Dev     | `pnpm dev`     |
| Build   | `pnpm build`   |
| Preview | `pnpm preview` |
| Lint    | `pnpm lint`    |

`pnpm build` runs `tsc -b` before `vite build`, so type errors fail the build.

## Architecture

```
index.html          Vite entry HTML
src/main.tsx        React root, mounts <App /> into #root
src/App.tsx         Root component
src/assets/         Imported assets (bundled and hashed)
public/             Static files served as-is at /
vite.config.ts      Vite config
tsconfig.app.json   TS config for src/
tsconfig.node.json  TS config for build tooling
```

No router, state manager, or test runner is installed yet. Add them deliberately
when a feature actually needs one.

## Conventions

- Conventional Commits; no AI attribution or `Co-Authored-By` trailers.
- Technical artifacts (code, comments, docs, tests, commit messages) in English.
- One component per file, PascalCase file names for components.
- Prefer editing existing files over creating new ones; no proactive docs.

## Testing

No test runner configured yet. If tests are needed, Vitest is the natural fit
for a Vite project — confirm with the user before adding it.

## Notes for Claude

- Verify claims against the code before stating them; do not assume file or symbol names.
- Ask one question at a time when requirements are ambiguous, then wait.
