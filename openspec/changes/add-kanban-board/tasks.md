# Tasks: Add Kanban Board

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000-2500 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR, `size:exception` |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: RESOLVED — maintainer approved `size:exception` on 2026-09-12. One PR, no split. Forecast shown to the approver: ~2000-2500 changed lines, 400-line budget risk High. Alternatives offered and declined: 2-PR split (domain/UI) and 5-PR split (per work unit).
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

Rationale: test infra (~45 lines) + domain layer code+tests (~930 lines, largest single block: `theme/tokens.ts`+test and `board.ts`+test) + application hooks (~80) + 8 presentational components + CSS modules (~600) + RTL integration/DnD tests (~300) + app wiring/deletions (~150 net) exceeds the 400-line guard by roughly 5x. `review_budget_lines` is set to unlimited and `delivery_strategy` is `single-pr`, so per guard rules this requires maintainer-approved `size:exception`, not chaining — reported honestly per orchestrator instruction, not chained despite the size.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Test infra installed and resolving | PR 1 | `pnpm test` (empty suite runs) | `pnpm install && pnpm test` | Revert package.json/vite.config.ts/setup.ts |
| 2 | Domain layer, fully unit-tested | PR 1 | `pnpm vitest run src/features/kanban/domain` | N/A — pure functions, no runtime harness needed | Delete `domain/` folder |
| 3 | Application hooks over domain | PR 1 | `pnpm vitest run src/features/kanban/application` | N/A — hooks tested via component render | Delete `application/` folder |
| 4 | Presentational components + CSS | PR 1 | `pnpm vitest run src/features/kanban/ui` | `pnpm dev` manual render check | Delete `ui/` folder |
| 5 | App wiring + starter cleanup | PR 1 | `pnpm build && pnpm lint` | `pnpm dev`, visually confirm board renders full width | Revert `App.tsx`/`index.css`/`index.html`, restore `App.css` |

## Phase 1: Test Infrastructure

- [x] 1.1 `package.json`: add devDeps `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`; add `test` (`vitest run`) and `test:watch` scripts
- [x] 1.2 Run `pnpm install`; verify Vitest's peer range resolves against Vite 8.3.0. If it fails, fall back to a standalone `vitest.config.ts` using `mergeConfig` with the existing `vite.config.ts` (per design's documented contingency) — resolved cleanly, no fallback needed
- [x] 1.3 `vite.config.ts`: switch `defineConfig` import to `vitest/config`; add `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: false }`
- [x] 1.4 Create `src/test/setup.ts`: import `@testing-library/jest-dom/vitest`; call `afterEach(cleanup)` from `@testing-library/react` explicitly (required because `globals: false` disables RTL auto-cleanup)
- [x] 1.5 `openspec/config.yaml`: set `strict_tdd: true`, `testing.test_command: "pnpm test"`, `testing.layers.unit/integration: true`, `rules.apply.tdd: true`, `rules.apply.test_command: "pnpm test"`

## Phase 2: Domain Layer (pure, React-free, TDD)

- [x] 2.1 Create `src/features/kanban/domain/types.ts`: `Card`, `Column`, `Board`, `ColumnId`, `Priority`, `DragSource`, `DropTarget`, `TaskDraft`, `ThemeTokenName`, `Theme`, `isColumnId` guard (use `import type` per `verbatimModuleSyntax`; no `enum` per `erasableSyntaxOnly`)
- [x] 2.2 RED `domain/seed.test.ts`: assert 4 columns in fixed order/name/accent (`kanban-board` spec table); 6 seed cards distributed todo:2, doing:2, review:1, done:1
- [x] 2.3 GREEN `domain/seed.ts`: implement seed board to pass 2.2
- [x] 2.4 RED `domain/presentation.test.ts`: `hashStr` determinism; `initials` for 0/1/2-word names ("Ana" → "A"); same tag → identical chip color across calls; `avatarColor` palette-index stability, theme-independent
- [x] 2.5 GREEN `domain/presentation.ts`: `hashStr`, `initials`, `tagChip`, `avatarColor`, `priorityMeta`
- [x] 2.6 RED `domain/theme/tokens.test.ts`: `lightTheme`/`darkTheme` contain every `ThemeTokenName` key with the exact design-source string, including the 6 literal `#fff` values (`cardBg`, `inputBg`, `badgeBg`, `modalBg`, `cancelBg`, `PRIORITY_META.Alta.fg`) — do NOT assert every value starts with `oklch(`
- [x] 2.7 GREEN `domain/theme/tokens.ts`: `lightTheme`, `darkTheme`, palettes, `PRIORITY_META`, values copied verbatim from design source (mixed `oklch()`/`#fff`, never normalized)
- [x] 2.8 RED `domain/theme/cssVars.test.ts`: `toCssVars(theme)` maps every token to its `--kb-*` custom property
- [x] 2.9 GREEN `domain/theme/cssVars.ts`: implement `toCssVars`
- [x] 2.10 RED `domain/search.test.ts`: `matchesQuery` matches title/tag/assignee, case-insensitive substring; `filterBoard` filters per-column independently, never mutates input
- [x] 2.11 GREEN `domain/search.ts`: `matchesQuery`, `filterBoard`
- [x] 2.12 RED `domain/board.test.ts` — `saveCard`: create appends to target column; edit with unchanged column replaces in place (index preserved, e.g. `[A,B,C]` edit B → `[A,B',C]`); edit with changed column removes from origin + appends to new column end; blank/whitespace-only title discards (no mutation); blank assignee → "Sin asignar", blank due → "Sin fecha"; tags `" Frontend ,, Bug "` → `["Frontend","Bug"]`
- [x] 2.13 RED (same file) — `deleteCard`: removes card from its column, returns new board, does not mutate input
- [x] 2.14 RED (same file) — `moveCard` full contract: `before-card` same-column dragging downward (`[A,B,C,D]`, A→C ⇒ `[B,A,C,D]`) and upward (`[A,B,C,D]`, D→B ⇒ `[A,D,B,C]`); drop-on-self no-op (`target.cardId === drag.cardId`); `before-card` cross-column inserts before target's real (post-removal) index; `end-of-column` appends; unknown `cardId`/`columnId` leaves board unchanged; every case preserves total card count and does not mutate the input board
- [x] 2.15 RED (same file) — `nextCardId` = max(all ids) + 1; `resolveInsertIndex` clamps as a defensive invariant, not load-bearing arithmetic
- [x] 2.16 GREEN `domain/board.ts`: implement `moveCard` (remove first, then resolve target index by id in the post-removal array — no `insertAt -= 1` compensation), `saveCard`, `deleteCard`, `nextCardId`, `resolveInsertIndex` to pass 2.12-2.15
- [x] 2.17 REFACTOR: confirm zero React imports anywhere under `domain/`; all board operations are `(Board, ...) => Board` and never mutate their input

## Phase 3: Application Hooks

- [x] 3.1 Create `application/useBoard.ts`: `useState<Board>(seed)`; `move`/`save`/`delete` wrappers calling the domain functions from Phase 2
- [x] 3.2 Create `application/useTaskModal.ts`: open/close, `mode: 'create' | 'edit'`, draft field state, preselects column per entry point ("doing" column button → "doing"; header button → "todo")
- [x] 3.3 (added post-review — RETROFITTED CHARACTERIZATION TEST, not RED-first: `useBoard.ts` predates this test by ~20 minutes per file mtimes; no RED phase occurred) `application/useBoard.test.ts`: renderHook coverage for initial seed state, `move`/`save`/`remove` delegating to the domain functions
- [x] 3.4 (added post-review — RETROFITTED CHARACTERIZATION TEST, not RED-first, same reason as 3.3) `application/useTaskModal.test.ts`: renderHook coverage for initial state, `openCreate`/`openEdit`/`close`/`updateDraft`/`setColumnId`
- [x] 3.5 (added post-review, scope note: proposal.md listed "real date handling" as Out of Scope — user explicitly requested this) `domain/validation.test.ts` RED + `domain/validation.ts` GREEN: `isValidDueDate(value)` — empty/whitespace valid (defaults to "Sin fecha" downstream), `"<day> <spanish month abbr>"` format required otherwise, day range validated per month
- [x] 3.6 (same scope note) `ui/TaskModal.tsx`: wired `isValidDueDate` into the Save handler — invalid due date keeps the modal open and shows "Fecha límite inválida" instead of saving; RED integration test written first, then GREEN wiring added

## Phase 4: Presentational Components

- [x] 4.1 Create `ui/TagChip.tsx` + `TagChip.module.css`
- [x] 4.2 Create `ui/Avatar.tsx` + `Avatar.module.css`: up to 2 uppercase initials, hashed background color
- [x] 4.3 Create `ui/PriorityBadge.tsx` + `PriorityBadge.module.css`: fixed colors, theme-independent
- [x] 4.4 Create `ui/TaskCard.tsx` + `TaskCard.module.css`: tag chips, title, avatar+due, priority badge in order; `:hover` rule over `var(--kb-*)` replacing the design's non-standard `style-hover`; drag handlers via props, drag source written to `dragRef` (not `dataTransfer`)
- [x] 4.5 Create `ui/ColumnPanel.tsx` + `ColumnPanel.module.css`: accent dot, name, filtered-count badge, card list, "Sin tareas" empty state, "+ Añadir tarea"; `onDragOver` calls `preventDefault()`; background drop resolves `end-of-column`
- [x] 4.6 Create `ui/BoardHeader.tsx` + `BoardHeader.module.css`: logo, "Proyecto Aurora", "Tablero de gestión de tareas", search input, theme toggle, "+ Nueva tarea"
- [x] 4.7 Create `ui/TaskModal.tsx` + `TaskModal.module.css`: title, description, column, priority (default "Media"), assignee, due, tags fields; "Eliminar" only in edit mode; "Cancelar"/overlay-click discard without persisting
- [x] 4.8 Create `ui/KanbanBoard.tsx`: container wiring `useBoard`, `useTaskModal`, `dragRef` (`useRef<DragSource | null>`), root `--kb-*` vars via `toCssVars(theme)` (single `as React.CSSProperties` cast), drag/drop handlers per design's sequence diagram (card `stopPropagation` distinguishes card-drop from column-background-drop)

## Phase 5: Integration Tests (RTL)

- [x] 5.1 RED `ui/KanbanBoard.test.tsx`: mount renders header + 4 columns + 6 seed cards with exact Spanish copy
- [x] 5.2 RED (same file or `ColumnPanel.test.tsx`): search filters per column; badges show filtered counts, not totals; empty-after-filter column shows "Sin tareas"
- [x] 5.3 RED: theme toggle flips root `--kb-*` vars light→dark and back
- [x] 5.4 RED `ui/TaskModal.test.tsx`: create/edit/delete round trips; blank/whitespace title discards without mutation; overlay/"Cancelar" discards; blank assignee/due defaults; tag parsing
- [x] 5.5 RED (DnD): cross-column move, same-column reorder up/down, drop-on-self no-op, drop-on-column-background append, reorder/cross-column move under an active search filter (defect-1 regression, via `fireEvent.dragStart/dragOver/drop`, no `DataTransfer` stub needed)
- [x] 5.6 GREEN: fix any gaps in Phase 3/4 wiring until 5.1-5.5 pass

## Phase 6: App Wiring & Cleanup

- [x] 6.1 `src/App.tsx`: render `<KanbanBoard />`, remove starter markup
- [x] 6.2 Delete `src/App.css` (fully superseded by CSS modules)
- [x] 6.3 `src/index.css`: remove the `#root { width: 1126px; text-align: center; border-inline: ...; ... }` block (lines 53-63) entirely — it caps board width and centers text — and replace starter rules with the design's reset
- [x] 6.4 `index.html`: add Google Fonts `preconnect` + stylesheet link for Inter 400/500/600 and Poppins 600/700/800
- [x] 6.5 Delete `src/assets/*` starter assets with no remaining reference
- [x] 6.6 Verify: `pnpm test`, `pnpm build`, `pnpm lint` all pass clean — 62/62 tests, clean build; `pnpm lint`'s script invocation OOMs in this sandbox, but `pnpm exec oxlint` and the direct binary both confirm zero lint findings (exit 0)

## Phase 7: Verify Remediation (rev 2 blockers)

- [x] 7.1 Close CRITICAL #1 — `ui/KanbanBoard.test.tsx`: header "+ Nueva tarea" opens the create modal with the column `<select>` preselected to `board[0].id` (`todo` / "Por hacer"). Covers `kanban-board` / Add Task Entry Points / "Header button defaults to first column"
- [x] 7.2 Close CRITICAL #2 — `ui/KanbanBoard.test.tsx`: opening an existing card, clearing its title to whitespace and saving closes the modal but leaves the card and the column count untouched. Covers `task-management` / Title Validation on Save / "Whitespace-only title discards edit"
- [x] 7.3 Verify both new tests are load-bearing by mutation: `board[0].id` → `board[1].id` fails 7.1; deleting the `if (!title) return board` guard fails 7.2. Both confirmed failing under mutation, passing after restore
- [x] 7.4 Full suite green after remediation: 83/83 tests, `pnpm build` exit 0, `pnpm lint` exit 0 (the OOM warning is emitted by an oxlint worker; the process still exits 0 with zero findings)

## Phase 8: Verify Remediation (rev 3 — corrective pass, single pass per contract)

- [x] 8.1 Close CRITICAL #3 (genuine RED→GREEN) — `ui/TaskModal.tsx` gated Save on due-date validity BEFORE checking the title, so a blank title + invalid due left the modal open, violating Title Validation on Save ("modal MUST close"). Failing test written first (`TaskModal.test.tsx > blank title wins over due-date validation`), confirmed RED against the pre-fix handler, then `handleSave()` reordered so a blank/whitespace title always proceeds to `onSave()` regardless of due-date validity
- [x] 8.2 Loosen `isValidDueDate` per the amended `specs/task-management/spec.md` "Due-Date Format Validation" requirement (genuine RED→GREEN, 16 test cases, 6 failing before the fix) — now accepts abbreviated Spanish month, full Spanish month name, `DD/MM`, `DD/MM/YYYY`, and ISO `YYYY-MM-DD`; year-less forms keep the Feb-29 blanket allowance, year-bearing forms validate the real leap-year status
- [x] 8.3 De-duplicate tags in `saveCard` (SUGGESTION 1, genuine RED→GREEN) — exact-string, order-preserving `Set`-based dedup, so repeated tags never produce duplicate React keys in `TaskCard`'s chip list; test added to `board.test.ts`
- [x] 8.4 Give `isColumnId` (WARNING 9) a real call site: `ui/TaskModal.tsx`'s column-`<select>` handler now runs the value through `isColumnId` instead of an unchecked `as ColumnId` cast. Added `domain/types.test.ts` — RETROFITTED CHARACTERIZATION TEST, not RED-first (the guard function itself predates this task; only its new call site is new production behavior)
- [x] 8.5 Eliminate CSS-module class-name and DOM-position test coupling (WARNING 4, 17 lines / 21 occurrences) — added `data-testid` (`card-${id}`, `column-${id}`, `column-badge`, `modal-overlay`) to `TaskCard`/`ColumnPanel`/`TaskModal` (structural-only, no behavior change) plus semantic `<label htmlFor>`/`id` pairs on every `TaskModal` field; rewrote `KanbanBoard.test.tsx`, `TaskModal.test.tsx`, `DragAndDrop.test.tsx` to query by testid/label/role instead of `[class*="…"]` or triple `.parentElement!` chains
- [x] 8.6 Theme toggle test now asserts all 15 `--kb-*` vars in both directions, not 1 of 15 (WARNING 1) — test-only, `KanbanBoard.test.tsx`
- [x] 8.7 Split the mislabeled "discards edits on overlay click or Cancelar" test (WARNING 2 / SUGGESTION 6) into two accurately-named tests, each driving its own real interaction (`getByTestId('modal-overlay')` click vs. `getByRole('button', {name:'Cancelar'})` click) — test-only
- [x] 8.8 Drive the column `<select>` via `user.selectOptions` in both create and edit flows (WARNING 3), covering `saveCard`'s column-change branch end-to-end through the actual UI control — test-only, `TaskModal.test.tsx`
- [x] 8.9 Fix `presentation.test.ts`'s mislabeled "is theme-independent" test, which varied nothing (WARNING 5 / SUGGESTION 6) — replaced with a discriminating-power test (`avatarColor` differs for different names) — test-only
- [x] 8.10 `tokens.test.ts` now asserts the exact value of all 15 tokens for both themes via full-object `toEqual`, not just key presence for 11/30 (WARNING 6) — test-only
- [x] 8.11 Extend `useBoard.test.ts` to cover `save()`'s position-preservation and blank-title branches, which `board.test.ts` already covered but the hook wrapper did not (SUGGESTION 5) — test-only
- [x] 8.12 `index.html`: `lang="en"` → `lang="es"` (SUGGESTION 2) — the entire UI is Spanish
- [x] 8.13 Delete unreferenced `public/icons.svg` (SUGGESTION 3) — confirmed zero references across `src/**/*.{ts,tsx,css}` and `index.html` before deleting
- [x] 8.14 Add the missing `priority: 'Media'` assertion to the create-modal-defaults test so its name matches its body (SUGGESTION 6, third mislabeled test) — test-only
- [x] 8.15 RECORD CORRECTION (WARNING 7/8): tasks 3.3, 3.4, and 8.4's `domain/types.test.ts` are retrofitted characterization tests — the production code they cover predates them, so no RED phase occurred for them. Do not read their `[x]` as evidence of a TDD cycle. All other tasks in this phase (8.1-8.3) are genuine RED→GREEN, confirmed by running the test before the fix existed
- [x] 8.16 Verification re-run after every item above: `npx vitest run` 13 files / 100 tests passed; `npx tsc -b` 0 errors; `npx vite build` exit 0; `./node_modules/.bin/oxlint` exit 0 with **0-byte output** (the load-bearing clean signal per the corrective-pass instructions, not just exit code)

## Phase 9: Final Blocker — Error-Clears-on-Edit Coverage (test-only)

- [x] 9.1 Close last blocker — `task-management` / Due-Date Format Validation / "Error clears on further edit" had no covering test (`validation.test.ts` is pure-function and structurally cannot cover it; `TaskModal.test.tsx`'s prior tests never triggered the error before checking its absence). Added `TaskModal.test.tsx > error clears on further edit of the due field, without clicking Guardar again`: asserts the error DOES appear after an invalid Save (so the test cannot pass vacuously the way `:79`'s old combined test could), then edits the due field again without clicking Guardar, and asserts the error is gone
- [x] 9.2 Mutation-verified 9.1 is load-bearing: neutralizing the error-clear line in `handleDueChange` makes the new test fail ("found <div>Fecha límite inválida</div>" after the edit); restored, passes again
- [x] 9.3 SUGGESTION — `KanbanBoard.test.tsx`'s theme-toggle test looped `Object.entries(toCssVars(...))`, which would pass vacuously on an empty object. Added inline `expect(Object.keys(lightVars)).toHaveLength(15)` / same for `darkVars` so the test is self-sufficient rather than relying on `cssVars.test.ts` to pin the count elsewhere
- [x] 9.4 No production code touched this phase — test-only, per explicit instruction. Tag de-duplication spec scenario intentionally NOT added here; that is being written in parallel by the spec phase
- [x] 9.5 Verification: `npx vitest run` 13 files / 101 tests passed; `pnpm build` exit 0 (bundle hash unchanged — `index-CJAaPpbe.js`, confirming zero production changes); `./node_modules/.bin/oxlint` exit 0, **0-byte output**
