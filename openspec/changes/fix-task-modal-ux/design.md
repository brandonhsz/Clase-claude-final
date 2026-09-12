# Design: Fix Task Modal UX

## Technical Approach

One pure validator in `domain/`, one presentational modal in `ui/`, one container in `ui/KanbanBoard.tsx` that owns board + search. `TaskModal` gains a `<form>`, dialog ARIA, and a ref-based focus lifecycle; it never learns about `Board`. Every new rule (blank title, due format, soft length limit, duplicate title, post-save visibility) is a pure function in `domain/`, so each one is unit-testable without React and the UI only decides *when* to render the result.

No new dependencies (verified against `package.json`: React 19, RTL, user-event, jsdom, Vitest only).

## Architecture Decisions

### D1 — `validateDraft(draft): DraftErrors` in `domain/validation.ts`

```ts
export type TitleErrorCode = 'blank'
export type DueErrorCode = 'invalid-format'
export interface DraftErrors { titleError: TitleErrorCode | null; dueError: DueErrorCode | null }

export function validateDraft(draft: TaskDraft): DraftErrors {
  return {
    titleError: draft.title.trim() ? null : 'blank',
    dueError: isValidDueDate(draft.due) ? null : 'invalid-format',
  }
}
```

Both fields are always evaluated — no early return — which is decision 4 of the proposal, expressed structurally rather than by ordering `if`s. Codes, not Spanish strings: UI copy stays in `TaskModal` where it already lives.

`TaskModal` calls `onSave()` only when both are `null`, so `KanbanBoard.handleSave` (`KanbanBoard.tsx:56-59`) keeps its unconditional `close()` and `useBoard.save` needs no success channel. `saveCard`'s `if (!title) return board` (`board.ts:28`) stays as an unreachable defensive no-op.

| Option | Tradeoff | Decision |
|---|---|---|
| Pure `validateDraft` in `domain/` | One rule, one place; RED tests need no DOM | **Chosen** |
| Keep ad-hoc `if`s in `handleSave` | Two drifting flags; forces the return-before-due bug back | Rejected |
| `save()` returns success through `useBoard` | Leaks a UI concern into the domain port | Rejected (proposal) |

**Conflict seam with `iso-due-date-picker`**: `validateDraft` touches the due field through exactly one call, `isValidDueDate(draft.due)`. That change's design keeps the signature `isValidDueDate(value: string): boolean` and only narrows the body to ISO, so `validateDraft` survives the migration byte-for-byte. Nothing in `validateDraft` may parse, format, or branch on the due string.

### D2 — Soft 80-char title limit

`export const TITLE_SOFT_LIMIT = 80` in `domain/validation.ts`. `TaskModal` renders `{draft.title.length}/{TITLE_SOFT_LIMIT}` always, with a warning class when `draft.title.length > TITLE_SOFT_LIMIT`. Raw `.length` for both counter and threshold so the number shown and the state shown never disagree. **No `maxLength` attribute** (maintainer rejected the hard cap) and the limit is deliberately *not* part of `DraftErrors` — over-length titles save.

### D3 — Duplicate title: a computed fact passed down, not board data passed in

`domain/board.ts` gains a pure predicate; `KanbanBoard` memoizes it into a `boolean` prop:

```ts
// domain/board.ts
export function hasDuplicateTitle(board: Board, columnId: ColumnId, title: string, excludeCardId: number | null): boolean
// trimmed, case-insensitive; empty title -> false; skips card.id === excludeCardId
```

| Option | Tradeoff | Decision |
|---|---|---|
| `KanbanBoard` computes `isDuplicateTitle: boolean` prop | `TaskModal` never imports `Board`; container-presentational preserved; `KanbanBoard` already holds both `board` and `modal.draft`, so zero new plumbing | **Chosen** |
| Pass `board` + call the helper inside `TaskModal` | Hands a presentational component the whole aggregate to answer one yes/no | Rejected |
| Pass `siblingTitles: string[]` | Moves the comparison rule (trim/case) into the UI | Rejected |

Computed against `board`, **not** `filteredBoard` — an active search must not hide a duplicate. Target column is `modal.columnId` (the `<select>` value), so switching columns re-evaluates. `excludeCardId = modal.draft.id` prevents a card warning against itself on edit. The warning is non-blocking: it is not in `DraftErrors` and never gates `onSave()`. `TaskModal` renders it only after a save attempt (proposal decision 1).

### D4 — Search clearing reuses `matchesQuery`, against the normalized card

`domain/search.ts` already exports `matchesQuery(card: Card, query: string): boolean` (title, tags, assignee name). That is the function reused — no second matcher. It needs a `Card`, and a `TaskDraft` is not one: `saveCard` normalizes `tagsText` into `tags` and defaults a blank assignee to `'Sin asignar'`. Matching raw draft text would diverge from what the board actually stores.

So the card-building block inside `saveCard` (`board.ts:31-45`) is extracted as `export function buildCard(board: Board, draft: TaskDraft): Card`, and `saveCard` calls it. Behavior-identical extraction; one normalization path.

```ts
function handleSave() {
  const saved = buildCard(board, modal.draft)
  save(modal.draft, modal.columnId)
  if (!matchesQuery(saved, search)) setSearch('')
  modal.close()
}
```

`matchesQuery` returns `true` for an empty query, so an inactive search is never cleared — no extra guard needed.

> **Deviation from the proposal**: its Affected Areas table marks `board.ts` *Unchanged*. That row is about keeping the `saveCard` blank-title guard, which this design keeps. The `buildCard` extraction is an addition to the same file; flagged here rather than performed silently.

### D5 — Focus lifecycle: `document.activeElement` captured in the mount effect

```ts
useEffect(() => {
  const opener = document.activeElement as HTMLElement | null
  titleRef.current?.focus()
  return () => {
    if (opener && opener !== document.body && opener.isConnected) opener.focus()
  }
}, [])
```

| Option | Tradeoff | Decision |
|---|---|---|
| Capture `document.activeElement` on mount | Zero prop changes across three openers; `isConnected` covers the deleted-card case | **Chosen** |
| `openerRef` set by `KanbanBoard` | Requires threading the event through `ColumnPanel.onAddClick` and `onCardClick`, changing two component contracts for one ref | Rejected |
| React's `autoFocus` attribute on the title input | React focuses it during commit, *before* `useEffect` runs, so the opener is already lost. This is why the explicit `titleRef` exists | Rejected |

The three openers behave differently and the design accepts that: `+ Nueva tarea` (`BoardHeader.tsx:37`) and `+ Añadir tarea` (`ColumnPanel.tsx:64`) are real `<button>`s and get focus back. A task card is a `<div>` with `onClick` and no `tabIndex` (`TaskCard.tsx:20-27`) — clicking it leaves `activeElement` at `<body>`, so restoration is correctly skipped. Making cards focusable is out of scope (`add-kanban-board`); when that lands, restoration starts working for them with no change here. Deleting a card while editing detaches its node, caught by `isConnected`.

### D6 — Trap and Escape on one container `onKeyDown`

Focus is trapped inside the modal, so a handler on the `.modal` div catches every relevant key by bubbling. No `document` listener, no effect cleanup, no leak if a second modal ever appears.

```ts
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
// Escape -> onCancel()
// Tab   -> query modalRef live, wrap last->first; Shift+Tab wraps first->last (preventDefault + focus)
```

Queried live on every Tab, not cached: `Eliminar` only exists in edit mode, so the first/last pair differs by mode. Document order equals tab order here because the modal contains no positive `tabIndex`.

### D7 — `<form>` wrapping and the submit-button hazard

`<form onSubmit={handleSubmit}>` wraps everything below the heading; `handleSubmit` calls `preventDefault()` then `validateDraft`. Guardar becomes `type="submit"`. Enter in any single-line input submits; Enter in the `<textarea>` inserts a newline (native and user-event behavior — no code needed).

**The hazard is real but already mitigated in this file**: a bare `<button>` inside a form defaults to `type="submit"`, which would make Enter fire Cancelar or Eliminar. `TaskModal.tsx:188` (Eliminar) and `:193` (Cancelar) already declare `type="button"` explicitly, so no regression exists today. This design makes it a standing rule — every non-submit button in the modal MUST declare `type="button"` — and pins it with a test asserting Enter neither cancels nor deletes.

**CSS regression**: `.modal` is `display:flex; flex-direction:column; gap:16px`. Inserting a `<form>` collapses its children into one flex item and loses the 16px rhythm. `.form` gets the same three declarations; `.modal` is unchanged and keeps `gap` between heading and form. Not covered by tests (CSS Modules are class-name stubs under Vitest) — verify manually.

### D8 — Dialog semantics

`role="dialog"`, `aria-modal="true"`, `aria-labelledby="task-modal-title"` on the `.modal` div (not the overlay, so overlay-click dismissal — spec-conformant, out of scope — is untouched). The heading (`TaskModal.tsx:78`) gains `id="task-modal-title"`. Blocking errors render with `role="alert"`; the duplicate-title warning renders with `role="status"` — the semantic split mirrors blocking vs. advisory. Errored inputs get `aria-invalid="true"`; the title input gets `aria-describedby` pointing at the counter and, when present, the error.

## Data Flow

```
  board ──┬─ filterBoard(board, search) ──> ColumnPanel (render only)
          │
          ├─ hasDuplicateTitle(board, modal.columnId, draft.title, draft.id) ─┐
          │                                                                   │
          └─ buildCard(board, draft) ── matchesQuery(card, search) ── setSearch('')
                                                                              │
  modal.draft ──> TaskModal ──validateDraft──> DraftErrors ──clean?──> onSave()┘
                     │                                                  │
                     └── TITLE_SOFT_LIMIT (counter, never blocks)       └── save() + close()
```

## Sequence: save attempt with blank title AND invalid due

```
user      TaskModal        validation        KanbanBoard   useBoard
 │ Enter/Guardar │              │                 │           │
 │──submit──────>│ preventDefault()               │           │
 │               │──validateDraft(draft)─────────>│           │
 │               │   { titleError:'blank',        │           │
 │               │     dueError:'invalid-format' }│           │
 │               │<───────────── both, no early return ───────│
 │               │ setErrors(next); next has errors -> RETURN  │
 │<─ 2x role="alert", modal OPEN, onSave NEVER called          │
 │               │              │                 │           │
 │ types in title field                           │           │
 │──change──────>│ clear errors.titleError only; dueError stays│
```

`onFieldChange` is wrapped in `TaskModal` so a `title` patch clears `titleError` and a `due` patch clears `dueError`, preserving the existing "error clears on further edit" requirement from `add-kanban-board`.

## Sequence: focus lifecycle

```
BoardHeader btn   TaskModal        title input      opener
      │ click          │                │              │
      │───────────────>│ mount          │              │
      │                │ useEffect: opener = document.activeElement (the button)
      │                │──────focus()──>│              │
      │                │   activeElement = #task-title │
      │  Tab x N ──────│ keydown Tab on .modal: last -> preventDefault -> first.focus()
      │                │   focus NEVER reaches the board search input
      │  Escape ───────│──onCancel()──> modal.close() -> isOpen=false
      │                │ unmount cleanup: opener.isConnected ? opener.focus() : skip
      │<───────────────────────── focus restored ──────│
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/kanban/domain/validation.ts` | Modify | Add `TITLE_SOFT_LIMIT`, `DraftErrors`, `validateDraft`. `isValidDueDate` untouched |
| `src/features/kanban/domain/board.ts` | Modify | Extract `buildCard`; add `hasDuplicateTitle`. `saveCard` guard kept |
| `src/features/kanban/ui/TaskModal.tsx` | Modify | `<form>`, dialog ARIA + heading `id`, `titleRef`/`modalRef`, focus effect, Tab trap, Escape, both errors, counter, duplicate warning, `type="submit"` on Guardar |
| `src/features/kanban/ui/TaskModal.module.css` | Modify | `.form` flex column + gap; `.counter` / `.counterWarning`; `.warning` (reuse `.error` colour scale) |
| `src/features/kanban/ui/KanbanBoard.tsx` | Modify | `isDuplicateTitle` memo; `handleSave` clears `search` via `matchesQuery(buildCard(...))` |
| `src/features/kanban/domain/validation.test.ts` | Modify | `validateDraft` table; `TITLE_SOFT_LIMIT` |
| `src/features/kanban/domain/board.test.ts` | Modify | `buildCard`, `hasDuplicateTitle` |
| `src/features/kanban/ui/TaskModal.test.tsx` | Modify | Replace the two discard scenarios; a11y/keyboard/counter/duplicate tests |
| `src/features/kanban/ui/KanbanBoard.test.tsx` | Modify | Replace `title validation on edit`; add search-clearing tests |

## Testing Strategy

`strict_tdd: true` — RED first for every row.

| Layer | What | Approach |
|---|---|---|
| Unit | `validateDraft`: blank/whitespace → `'blank'`; invalid due → `'invalid-format'`; **both at once**; clean draft → both `null` | Vitest, table-driven, no DOM |
| Unit | `TITLE_SOFT_LIMIT === 80`; 80 chars not over, 81 over | Vitest |
| Unit | `hasDuplicateTitle`: same column match; case/whitespace insensitive; different column → `false`; `excludeCardId` → `false`; blank → `false` | Vitest |
| Unit | `buildCard` output equals the card `saveCard` stores (tags split/de-duped, `'Sin asignar'`, `'Sin fecha'`) | Vitest |
| Integration | Blank title keeps modal open, shows the error, creates nothing; both alerts render together; typing in title clears only the title error | RTL + user-event |
| Integration | `getByRole('dialog', { name: 'Nueva tarea' })`; `aria-modal="true"`; `aria-invalid` toggles | RTL |
| Integration | Title has focus after open; Escape closes; focus returns to `+ Nueva tarea` and to `+ Añadir tarea` | RTL, assert `document.activeElement` |
| Integration | `user.tab()` from the last control lands on the first; `Shift+Tab` from the first lands on the last; the board search input is never reached | RTL |
| Integration | Enter in the title submits; Enter in the `<textarea>` inserts `\n` and does not submit; Enter does not cancel or delete | RTL |
| Integration | Counter reads `n/80`, gains the warning state past 80, never truncates, and an 81+ char title still saves | RTL |
| Integration | Duplicate title in the target column warns without blocking; same title in another column does not warn; editing a card does not warn against itself | RTL |
| Integration | Search active + saved card does not match → search clears and the card is visible; saved card matches → search is preserved | RTL |

**jsdom limits, verified against what this suite actually uses:**

1. **Focus works.** jsdom implements `HTMLElement.focus()` and `document.activeElement`, so autofocus and restore are directly assertable.
2. **Tab traversal is simulated by user-event, not jsdom.** `user.tab()` walks its own focusable-element order and honours `preventDefault()` on `keydown`. The trap is therefore testable, and the RED test (focus escaping to the board search) is reachable because user-event's order spans the whole document. What is *not* observable: the real browser's sequential navigation, focus rings, and escape into browser chrome — accepted, manual check.
3. **Implicit form submission.** user-event v14 implements Enter-in-input → `form.requestSubmit()`, and jsdom 30 implements `requestSubmit`. If the RED test shows otherwise, fall back to `fireEvent.submit(form)` for the submit-path tests only and keep a real `user.keyboard('{Enter}')` test for the textarea case.
4. **No layout.** The focusable selector deliberately avoids `offsetParent`/visibility checks, which always fail in jsdom. The modal has no hidden focusables, so document order is sufficient.
5. **CSS is not testable.** CSS Modules resolve to stub class names; the `.form` flex fix (D7) is verified by eye, not by assertion.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. In-browser React feature over in-memory state.

## Migration / Rollout

No migration required — no persistence exists. Single PR; `git revert -m 1 <merge-commit>` is lossless.

**Merge ordering with `iso-due-date-picker`**: both touch `TaskModal.tsx` and `validation.ts`. Either order works because the contact surface is one call (`isValidDueDate(draft.due)`) and one JSX element (the due input). If `iso-due-date-picker` lands first, this change's `validateDraft` is written against the already-narrowed function with no edit. If this lands first, that change replaces the due `<input>` with `type="date"` inside the new `<form>` and rewrites only `isValidDueDate`'s body.

## Open Questions

- [ ] Duplicate comparison is specified as trimmed + case-insensitive. The `task-management` delta is being written in parallel; if it pins case-sensitive matching, the spec wins and D3 is amended.
- [ ] The heading stays a `<div>` with an `id`. Promoting it to `<h2>` would give the dialog a real heading level for screen-reader navigation, but heading semantics are not in the proposal's scope. Deferred, not rejected.
