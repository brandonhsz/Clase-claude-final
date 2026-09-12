# Proposal: Add Kanban Board

**OpenSpec exemption**: Not exempt — new feature plus new dependencies.

## Intent

The app still renders the Vite starter. A complete Kanban design ("Proyecto Aurora") sits at `Panel Kanban.html` in a design-canvas dialect the app cannot run. Ship it as a real React 19 feature. The repo has no test runner either, so Strict TDD cannot be honoured; this change fixes that first.

## Scope

### In Scope
- Vitest + React Testing Library + jsdom, a `test` script, updated `testing:` in `openspec/config.yaml` (`tdd: true`).
- Header: logo, title, subtitle, search, theme toggle, "+ Nueva tarea".
- Four columns (`todo`, `doing`, `review`, `done`): accent dot, name, filtered count badge, empty state, "+ Añadir tarea"; 290px, horizontally scrollable.
- Cards: hashed tag chips, title, hashed avatar initials, due text, priority badge.
- HTML5 drag and drop across and within columns, including the `moveCard` index adjustment.
- Create/edit/delete modal, search filter, light/dark `oklch()` theming, the design's 6 seed cards.

### Out of Scope
- Persistence of any kind. State is in memory; reload resets the board — a deliberate non-goal.
- Router, state-management library, CSS framework, component library.
- Auth, i18n, accessibility beyond what the design specifies.
- USER DECISION (maintainer-approved scope expansion, supersedes the original "real date handling" exclusion): due-date FORMAT validation ("Fecha límite") is now in scope — accepting Spanish month abbreviations/full names, `DD/MM[/YYYY]`, and ISO `YYYY-MM-DD`, with day-of-month range checks. Actual date semantics remain out of scope: no timezones, no real `Date` objects, no relative dates ("mañana"), no overdue highlighting. See `specs/task-management/spec.md` → Due-Date Format Validation.

## Capabilities

### New Capabilities
- `kanban-board`: layout, columns, card presentation, search filtering, theming.
- `task-management`: create, edit, delete, and validate tasks via the modal.
- `card-drag-drop`: moving and reordering cards with native HTML5 DnD.

### Modified Capabilities
- None. Test infrastructure is a prerequisite, not a spec-level behavior change.

## Approach

Translate the dialect mechanically: `sc-camel-on-*` → React handlers, `<sc-for>` → `.map()`, `<sc-if>` → conditional render, `{{ }}` → JSX. `DCLogic.state`/`setState` becomes `useState`; `renderVals()` becomes a view-model derived during render. Board mutations (`moveCard`, save, delete) and the hash/initials helpers become pure functions so TDD covers them before any UI exists. Colors stay verbatim `oklch()` tokens in two theme objects; Spanish UI copy is preserved exactly.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Vitest/RTL/jsdom devDeps, `test` script |
| `vite.config.ts` | Modified | Vitest config (jsdom, setup file) |
| `openspec/config.yaml` | Modified | `testing:` section, `tdd: true` |
| `src/App.tsx` | Modified | Renders the board |
| `src/features/kanban/**` | New | Components, hooks, pure logic, tests |
| `index.html`, `src/index.css` | Modified | Inter + Poppins, base reset |
| `Panel Kanban.html` | Unchanged | Reference only, never imported |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `moveCard` off-by-one (same-column `insertAt -= 1`) | High | Pure function, unit-tested both directions before UI |
| Card drop index is a filtered position while state is unfiltered | Med | USER DECISION (supersedes earlier assumption): fix it. Map the filtered drop target to its real index before splicing; cover with tests under an active search filter |
| Edit-mode save strips the card from every column and pushes it, moving it to the end | Med | USER DECISION (supersedes earlier assumption): fix it. Editing MUST preserve the card position when the column is unchanged |
| Fidelity drift during translation | Med | Specs quote exact strings and tokens |
| Test infra bundled with the feature in one PR | Accepted | User-accepted tradeoff; infra commits kept separate inside the PR |

## Rollback Plan

Single PR: `git revert -m 1 <merge-commit>`. No persisted state or migration exists, so revert is lossless. To undo only the test infrastructure: remove the Vitest/RTL/jsdom devDeps and `test` script, drop the `test` block from `vite.config.ts`, restore `test_command: ""` and `tdd: false` in `openspec/config.yaml`. `Panel Kanban.html` is untouched either way.

## Dependencies

- devDeps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- Inter and Poppins web fonts.

## Success Criteria

- [ ] `pnpm test` passes; `pnpm build` and `pnpm lint` stay clean.
- [ ] Board matches the design: 4 columns, 6 seed cards, exact Spanish copy.
- [ ] Cards drag between and within columns, including the index-adjust case.
- [ ] Create/edit/delete work; an empty title discards the save.
- [ ] Search filters by title, tag, and assignee; badges show filtered counts.
- [ ] Theme toggle switches all light/dark tokens.
