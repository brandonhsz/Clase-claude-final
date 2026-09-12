# Design: Add Kanban Board

## Technical Approach

Translate `Panel Kanban.html` into a feature slice at `src/features/kanban/`, split into three layers: a **pure domain** (no React import), **application hooks** (state + handlers), and **presentational components** (props in, JSX out). The design's `DCLogic` maps cleanly: `state` → `useState` in hooks, `renderVals()` → a view model derived during render, `dragInfo` (an instance field, deliberately not state) → `useRef`.

All risky logic — `moveCard`, save, delete, hashing, filtering — lives in the domain layer as pure functions over a `Board` value. This is what makes TDD possible before any component exists, and it is where both design defects are fixed. Test infrastructure (Vitest + RTL + jsdom) is installed first so RED tests can exist.

## Architecture Decisions

### Decision: Layering — pure domain, not full hexagonal

| Option | Tradeoff | Decision |
|---|---|---|
| Ports/adapters (hexagonal) | Ceremony with no payoff: persistence is an explicit non-goal, so there is **no** I/O boundary and every "adapter" would be empty | Rejected |
| Logic inside components | Untestable without rendering; blocks TDD | Rejected |
| `domain/` (pure) + `application/` (hooks) + `ui/` (presentational) | Keeps the genuinely valuable part of Clean Architecture — dependency direction points inward, domain has zero framework imports | **Chosen** |

**Rationale**: the user's hexagonal instinct is right about *dependency direction* and wrong about *ports* for this change — there is nothing external to port to. The `domain/` folder gets the full benefit (fast, deterministic, React-free unit tests) without inventing interfaces that have one implementation and no second caller.

### Decision: DEFECT 1 FIX — drop targets are identified by card id, never by index

`design.html:603` passes the **search-filtered** index into `moveCard`, which splices into the **unfiltered** array. Under an active filter the two disagree.

**Choice**: change the contract from `moveCard(toColumnId, toIndex)` to `moveCard(board, drag, target)` where

```ts
type DropTarget =
  | { kind: 'before-card'; columnId: ColumnId; cardId: number }
  | { kind: 'end-of-column'; columnId: ColumnId }
```

`moveCard` **removes first, then resolves the target index by id in the post-removal array**.

**Alternatives considered**: (a) pass both filtered and real indices — leaks view state into the domain; (b) have the UI translate filtered→real index before calling — puts the bug's root cause in the layer least covered by unit tests.

**Rationale**: ids are stable across any view transform; indices are view-relative. Filtering becomes a UI-only concern that the domain can never observe. As a bonus this **eliminates** the original `if (fromCol.id === toCol.id && idx < insertAt) insertAt -= 1` adjustment: that line existed only because `insertAt` was captured *before* the splice. Resolving after removal is already correct in both directions.

Explicit contract (each line is a required test):

| Input | Result |
|---|---|
| `before-card` where `target.cardId === drag.cardId` | Board unchanged (drop on self) |
| `before-card`, same column, dragging downward | Card lands immediately before the target |
| `before-card`, same column, dragging upward | Card lands immediately before the target |
| `before-card`, different column | Removed from source, inserted before target |
| `end-of-column` | Appended at the destination's end |
| Unknown `cardId` or `columnId` | Board unchanged — never a silent misplacement |
| Any outcome | Total card count preserved; input board not mutated |

`resolveInsertIndex(cards, target)` stays a named exported function with a defensive `clamp(i, 0, cards.length)`; after the redesign the clamp is an invariant assertion, not load-bearing arithmetic.

### Decision: DEFECT 2 FIX — edit preserves position unless the column changes

`design.html:538/541` strips the card from every column and `push`es it, so any edit sends the card to the bottom.

**Choice**: `saveCard(board, draft, mode, targetColumnId)` branches on whether the column actually changed.

| Case | Behavior |
|---|---|
| `create` | Append to target column (preserves design behavior) |
| `edit`, card's current column `===` target | Replace in place: `cards.map(c => c.id === id ? built : c)` — index untouched |
| `edit`, column changed | Remove from origin, append to target end |
| `edit`, id not found anywhere | Treat as create (append) |
| Empty `title.trim()` | Discard and close, no mutation (design behavior, preserved) |

**Rationale**: "append" is only meaningful when the card is arriving somewhere new. Within its own column the card already has a position and the user did not ask to move it.

### Decision: Card ids derived from the board, not a module counter

**Choice**: `nextCardId(board) = max(all ids) + 1`. **Rejected**: the design's module-level `let uid = 100`. **Rationale**: module state leaks between test files and makes id assertions order-dependent. Ids are never user-visible, so the numeric difference (first new id `7` instead of `100`) is not a fidelity regression.

### Decision: Theme tokens in TS, projected as CSS custom properties

**Choice**: keep `lightTheme` / `darkTheme` as two flat `Theme` objects of verbatim colour strings in `domain/theme/tokens.ts` (single source of truth, directly assertable in tests, traceable to the spec). A `toCssVars(theme)` adapter maps them to `--kb-*` custom properties applied **once** via inline `style` on the board root; components read `var(--kb-page-bg)` from CSS Modules.

**Alternatives considered**: (a) TS objects threaded through every component as props — prop-drills a 15-key object into every leaf and makes hover impossible; (b) CSS-only tokens in a stylesheet — unassertable in unit tests, and the spec quotes exact token values.

**Rationale**: one mechanism solves theming *and* hover. Only the root element re-renders on toggle.

### Decision: Token values are `string`, and `#fff` is preserved — the palette is NOT uniformly `oklch()`

The token set is **mixed-format**. Verified against the design source:

| Site | Value |
|---|---|
| `design.html:578` `cardBg` | `'#fff'` |
| `design.html:581` `inputBg` | `'#fff'` |
| `design.html:583` `badgeBg` | `'#fff'` |
| `design.html:584` `modalBg` | `'#fff'` |
| `design.html:587` `cancelBg` | `'#fff'` |
| `design.html:436` `PRIORITY_META.Alta.fg` | `'#fff'` |

All six are in the light set or in theme-independent data; every remaining light token and the **entire** dark set is `oklch()`. Literal `#fff` also appears in static markup at `:294`, `:309`, `:335`, `:408`.

**Choice**: `type Theme = Record<ThemeTokenName, string>` — values are plain `string`, and all six `#fff` values are carried through **verbatim**.

**Alternatives considered**:

| Option | Tradeoff | Decision |
|---|---|---|
| A template-literal type such as `` type Color = `oklch(${string})` `` | Would **fail to typecheck** against the six real `#fff` values above | Rejected |
| Normalize `#fff` → `oklch(1 0 0)` for uniformity | Same rendered colour, so it is defensible — but `specs/kanban-board/spec.md` pins each token to its exact design-source value, so normalizing puts the design in direct conflict with the spec and breaks its assertions | Rejected |

**Rationale**: the spec is the authority on token values and it pins them literally. A type that encodes a format assumption buys nothing here — these strings are opaque payloads handed to CSS, never parsed — and the one thing such a type *would* do is reject valid design values. Keep the values verbatim and let CSS validate them.

### Decision: Hover via CSS Modules, not `style-hover`

React does not support the design's non-standard `style-hover` attribute, and inline styles cannot express `:hover`.

| Option | Tradeoff | Decision |
|---|---|---|
| `onMouseEnter`/`onMouseLeave` + state | A re-render per pointer move over 6+ cards; hover state duplicated per element | Rejected |
| CSS-in-JS (emotion/styled) | New runtime dependency; proposal scopes out CSS frameworks | Rejected |
| CSS Modules (`*.module.css`) | Native `:hover`, scoped names, **zero config** — Vite handles it and `vite/client` already types `*.module.css` under the current `tsconfig.app.json` | **Chosen** |

The 4 `style-hover` sites (`:309` new-task button, `:326` card, `:347` add-task button, `:404` delete button) become `:hover` rules referencing `--kb-*` vars. Static layout styles move to the same module files, copied 1:1 from the design's inline strings.

**Constraint for tests**: Vitest's default `css: false` means CSS Module class names are not real at runtime. Tests MUST query by role/text, never by class name.

### Decision: Drag source in a ref, not `dataTransfer`

**Choice**: `useRef<DragSource | null>(null)` in the container, mirroring the design's non-reactive `dragInfo` field. **Rejected**: `dataTransfer.setData()`. **Rationale**: the drag source does not affect render output, so a ref avoids a re-render on every `dragstart`; and jsdom does not implement `DataTransfer`, so `fireEvent.drop` would require a hand-rolled stub in every DnD test. `e.preventDefault()` on `dragover` is still required for `drop` to fire.

### Decision: Vitest config inside `vite.config.ts`, `globals: false`

**Choice**: `import { defineConfig } from 'vitest/config'` in the existing `vite.config.ts`, adding a `test` block. **Rejected**: a separate `vitest.config.ts`, which would duplicate the `react()` plugin (or need `mergeConfig`) and require editing `tsconfig.node.json`'s `include`.

**Rationale for `globals: false`**: tests import `{ describe, it, expect }` from `'vitest'` explicitly, so `tsconfig.app.json`'s `"types": ["vite/client"]` needs **no** change and `tsc -b` type-checks test files under `include: ["src"]` unmodified.

**Gotcha this creates**: with `globals: false`, React Testing Library does **not** auto-cleanup. The setup file must do it explicitly:

```ts
// src/test/setup.ts — inside `include: ["src"]`, so tsc -b sees the jest-dom augmentation
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(cleanup)
```

### Decision: Fonts via Google Fonts `<link>` in `index.html`

**Choice**: `preconnect` + stylesheet link for Inter 400/500/600 and Poppins 600/700/800 (the exact weights in the design's `@font-face` blocks). **Rejected**: `@fontsource/*` packages — two new dependencies the proposal does not list. **Rationale**: matches the design's own `helmet` preconnect intent; jsdom never loads webfonts, so tests are unaffected.

## Data Flow

```
    tokens.ts ──toCssVars──┐
                           v
  useBoard ──board──> KanbanBoard (container) ──CSS vars on root──> --kb-*
     ^                     |
     |                filterBoard(board, query)   <-- view only
     |                     v
     |            BoardHeader   ColumnPanel[]  TaskModal
     |                 |             |             |
     |            search/theme   TaskCard[]    draft fields
     |                 |             |             |
     └──── moveCard / saveCard / deleteCard (pure domain) ◄────────┘
                           ^
                    dragRef (useRef, non-reactive)
```

`filterBoard` sits strictly between state and render. No mutation path ever receives its output.

## Sequence: Drag and Drop (the complex flow)

```
TaskCard(src)   TaskCard(dst)   ColumnPanel   KanbanBoard   dragRef   domain/board
     |               |               |             |           |           |
 dragstart ──────────────────────────────────────> |           |           |
     |               |               |     onCardDragStart(id, fromCol)    |
     |               |               |             | ─write──> |           |
     |               |               |             |           |           |
     |           dragover ─────────────────────────> preventDefault()      |
     |               |               |             |  (required, else no drop)
     |               |               |             |           |           |
     |            drop ────────────────────────────> |         |           |
     |               |               |    preventDefault() + stopPropagation()
     |               |               |             | ─read───> |           |
     |               |               |             | moveCard(board, drag, |
     |               |               |             |   {before-card, col, cardId}) 
     |               |               |             | ────────────────────> |
     |               |               |             |   remove by id, then  |
     |               |               |             |   resolve index by id |
     |               |               |             | <──── new board ───── |
     |               |               |             | setBoard + dragRef=null
     |               |               |             |           |           |
  (alt: drop on column background, card's stopPropagation did not fire)
     |               |         drop ─────────────> | moveCard(board, drag, |
     |               |               |             |   {end-of-column, col})
```

The card's `stopPropagation` is what distinguishes a card drop from a column-background drop; both paths converge on the same pure function.

## File Changes

| File | Action | Description |
|---|---|---|
| `package.json` | Modify | devDeps `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`; scripts `test` (`vitest run`), `test:watch` |
| `vite.config.ts` | Modify | `defineConfig` from `vitest/config`; `test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], globals: false }` |
| `openspec/config.yaml` | Modify | `strict_tdd: true`, `rules.apply.tdd: true`, `test_command: "pnpm test"`, `layers.unit/integration: true` |
| `src/test/setup.ts` | Create | jest-dom matchers + explicit `afterEach(cleanup)` |
| `src/features/kanban/domain/types.ts` | Create | `Card`, `Column`, `Board`, `Assignee`, `ColumnId`, `Priority`, `DragSource`, `DropTarget`, `TaskDraft`, `isColumnId` guard |
| `src/features/kanban/domain/board.ts` | Create | `moveCard`, `resolveInsertIndex`, `saveCard`, `deleteCard`, `nextCardId` — both defect fixes live here |
| `src/features/kanban/domain/search.ts` | Create | `matchesQuery`, `filterBoard` |
| `src/features/kanban/domain/presentation.ts` | Create | `hashStr`, `initials`, `tagChip`, `avatarColor`, `priorityMeta` |
| `src/features/kanban/domain/theme/tokens.ts` | Create | `lightTheme`, `darkTheme`, palettes, `PRIORITY_META` — values copied verbatim; mixed `oklch()` / `#fff`, never normalized |
| `src/features/kanban/domain/theme/cssVars.ts` | Create | `toCssVars(theme)` → `--kb-*` |
| `src/features/kanban/domain/seed.ts` | Create | The 4 columns and 6 seed cards, exact Spanish strings |
| `src/features/kanban/domain/*.test.ts` | Create | Unit tests, RED-first |
| `src/features/kanban/application/useBoard.ts` | Create | Board state + `move`/`save`/`delete` wrappers |
| `src/features/kanban/application/useTaskModal.ts` | Create | Modal open/close/mode/draft state |
| `src/features/kanban/ui/KanbanBoard.tsx` | Create | Container: owns hooks, `dragRef`, root CSS vars, builds handlers |
| `src/features/kanban/ui/BoardHeader.tsx` | Create | Presentational: logo, title, subtitle, search, theme toggle, "+ Nueva tarea" |
| `src/features/kanban/ui/ColumnPanel.tsx` | Create | Presentational: accent dot, name, filtered badge, cards, "Sin tareas", "+ Añadir tarea" |
| `src/features/kanban/ui/TaskCard.tsx` | Create | Presentational: chips, title, avatar, due, priority badge |
| `src/features/kanban/ui/TagChip.tsx`, `Avatar.tsx`, `PriorityBadge.tsx` | Create | Leaf presentational components |
| `src/features/kanban/ui/TaskModal.tsx` | Create | Presentational form; all 7 fields, Eliminar/Cancelar/Guardar |
| `src/features/kanban/ui/*.module.css` | Create | Layout + `:hover` rules over `var(--kb-*)` |
| `src/features/kanban/ui/*.test.tsx` | Create | RTL integration tests |
| `src/App.tsx` | Modify | Render `<KanbanBoard />`; delete the Vite starter markup |
| `src/App.css` | Delete | Starter-only styles, fully superseded |
| `src/index.css` | Modify | Replace starter rules with the design's reset. **The current `#root { width: 1126px; text-align: center; border-inline: ... }` would cap the board at 1126px and centre its text — it MUST be removed**, not merely overridden |
| `index.html` | Modify | Google Fonts preconnect + Inter/Poppins link |
| `src/assets/*` | Delete | Starter assets with no remaining reference |

## Interfaces / Contracts

`erasableSyntaxOnly: true` forbids `enum`; `verbatimModuleSyntax: true` requires `import type`.

```ts
export type ColumnId = 'todo' | 'doing' | 'review' | 'done'
export type Priority = 'Alta' | 'Media' | 'Baja'
export type ThemeMode = 'light' | 'dark'

export interface Card {
  id: number; title: string; desc: string; tags: string[]
  assignee: { name: string }; due: string; priority: Priority
}
export interface Column { id: ColumnId; name: string; accent: string; cards: Card[] }
export type Board = readonly Column[]

export interface DragSource { cardId: number; fromColumnId: ColumnId }

// Token values are plain `string`: the palette mixes oklch() and #fff.
// Do NOT narrow this to an `oklch(${string})` template literal type.
export type ThemeTokenName =
  | 'pageBg' | 'textPrimary' | 'textSecondary' | 'textMuted'
  | 'panelBg' | 'cardBg' | 'cardBorder' | 'cardHoverBorder'
  | 'inputBg' | 'inputBorder' | 'badgeBg' | 'modalBg'
  | 'overlayBg' | 'addHover' | 'cancelBg'
export type Theme = Record<ThemeTokenName, string>

// All board operations: (Board, ...) => Board. Never mutate the input.
export function moveCard(board: Board, drag: DragSource, target: DropTarget): Board
export function saveCard(board: Board, draft: TaskDraft, targetColumnId: ColumnId): Board
export function deleteCard(board: Board, cardId: number): Board
```

`toCssVars` returns custom properties, which `React.CSSProperties` does not model; a single `as React.CSSProperties` cast at that one boundary is expected.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `moveCard` (full contract table above), `saveCard` position preservation, `deleteCard`, `nextCardId`, `resolveInsertIndex` clamping, immutability of the input board | Vitest, no React, RED before any component |
| Unit | `hashStr` determinism, `initials` (one word, two words, empty), palette index stability, `matchesQuery` across title/tag/assignee | Vitest, table-driven |
| Unit | `lightTheme`/`darkTheme` contain every expected key with the exact design-source string, **including the six `#fff` values** — an assertion that every value starts with `oklch(` would be a wrong test | Vitest, snapshot-free explicit assertions |
| Integration | Render board → 4 columns, 6 seed cards, exact Spanish copy; search filters and updates badges; theme toggle flips root `--kb-*`; modal create/edit/delete round trips; empty title discards | RTL + `user-event`, query by role/text |
| Integration | Drag across columns, reorder within a column, drop-on-self no-op, **drop under an active search filter lands correctly** (the defect-1 regression test) | RTL `fireEvent.dragStart/dragOver/drop`; the ref-based drag source means no `DataTransfer` stub is needed |
| E2E | None | Out of scope — no runner, no routing, no backend |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. This is an in-browser React feature with in-memory state only.

## Migration / Rollout

No migration required. Persistence is an explicit non-goal, so there is no stored state to migrate and no feature flag is warranted. Rollback is the proposal's single `git revert -m 1`.

## Open Questions

- [ ] Vitest's peer range against Vite 8.3.0 must be confirmed at install time. If `pnpm add -D vitest` cannot satisfy the peer, the fallback is a standalone `vitest.config.ts` sharing plugins via `mergeConfig` — this changes one decision above, not the architecture.
- [ ] `card-drag-drop` and `task-management` delta specs were not yet on disk when this design was written (only `specs/kanban-board/spec.md` existed). The contract tables above are the design's position; if those specs land with a conflicting rule, the spec wins and this document must be revised.
