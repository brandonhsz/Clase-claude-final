# Design: ISO Due Date Picker

## Technical Approach

`due` becomes a single canonical format — ISO `YYYY-MM-DD`, or `''` — held identically by `Card`, `TaskDraft`, and the DOM control. Everything else follows from that: `<input type="date">` binds straight to `draft.due` with no conversion, `isValidDueDate` narrows to one pattern, and the Spanish short form (`18 sep`) plus the `Sin fecha` placeholder become a pure render-time projection.

The existing layering (`domain/` pure, `application/` hooks, `ui/` presentational) is unchanged. No new file is created; five existing files change.

## Architecture Decisions

### Decision: `formatDueDate` lives in `domain/presentation.ts`; month data moves there and is deleted from `validation.ts`

| Option | Tradeoff | Decision |
|---|---|---|
| `domain/presentation.ts` | Matches the existing home of `tagChip`, `avatarColor`, `priorityMeta`, `initials` — pure functions that derive display values from domain data | **Chosen** |
| A new `ui/formatDueDate.ts` | Formatting is framework-free and unit-testable without React; moving it to `ui/` loses the fast test path the domain layer exists to provide | Rejected |
| Leave it in `validation.ts` | Conflates "is this acceptable input" with "how is this shown" in one module | Rejected |

**Month data**: ISO validation needs no month names, so `MONTH_INDEX` becomes dead in `validation.ts` and is **deleted there**, not re-exported. `presentation.ts` declares `const MONTH_ABBR: readonly string[]` — 12 ordered lowercase abbreviations. This is a relocation, not a duplication: after the change, month names exist in exactly one module, the only one that still needs them.

**Rejected**: inverting `MONTH_INDEX` at runtime. It maps two keys per month (`sep` and `septiembre` both → 9), so an inversion has to arbitrarily pick a winner per key-iteration order. An ordered 12-element array states the intent directly.

### Decision: `validation.ts` is narrowed, not kept permissive

| Symbol | Action |
|---|---|
| `MONTH_INDEX`, `NAMED_MONTH_PATTERN`, `NUMERIC_PATTERN` | **Deleted** |
| `daysInMonth(month, year?)` | **Narrowed** to `daysInMonth(month: number, year: number)`. The `year === undefined` leap-day allowance branch is **removed** — ISO always carries a year, so the branch is unreachable |
| `isValidCalendarDay(day, month, year?)` | **Narrowed**: `year` required |
| `ISO_PATTERN`, `isLeapYear`, `DAYS_IN_MONTH` | Kept unchanged |
| `isValidDueDate(value: string): boolean` | Signature kept. Body: trim → `''` is valid → `ISO_PATTERN` → calendar check → `false`. Whitespace-only stays valid |

No dead code survives. `29 feb`/`29/02` permanent-leap-day behavior disappears with the formats that produced it.

### Decision: `TaskDraft.due` holds ISO; `TaskModal` is a thin binding

`useTaskModal.ts:32` (`due: card.due`) needs **no change** — copying unchanged is now correct precisely because both sides are ISO. `emptyDraft()`'s `due: ''` is already the "no date" value.

`TaskModal` binds `value={draft.due}` to `<input type="date">` and drops `placeholder="Ej: 20 sep"` (date controls ignore `placeholder`).

**If a non-ISO value ever reaches the control**: the browser's value-sanitization renders the control blank. No defensive coercion is added in the UI — coercing would silently hide a domain bug. Instead `isValidDueDate` (kept per proposal assumption 2) catches it on save: the corrupt string is still in `draft.due` because no `change` event fired, so `Fecha límite inválida` appears. That failure path is the entire justification for keeping the message.

### Decision: `TaskCard` calls `formatDueDate(card.due)` directly

`TaskCard.tsx:31` already calls `tagChip(tag, themeMode)` inline, and `Avatar` resolves its own initials/colour. Preformatting `due` in `KanbanBoard` would thread a prop through `ColumnPanel` for one string and break that pattern for no gain.

### Decision: `due` stays `string`; no branded ISO type

**Alternatives considered**: `type IsoDate = string & { readonly __iso: unique symbol }` with a `toIsoDate` parser.

**Rationale, from this codebase**: the `add-kanban-board` design already rejected a format-encoding type for `Theme` values on the grounds that it buys nothing and rejects valid data. More decisively, `TaskDraft` is the *in-flight* buffer — between keystrokes it legitimately holds a partial value, so branding it would be a false claim, and branding only `Card` forces a cast at `saveCard`, at all six seed entries, and in every test fixture. The invariant has exactly one write boundary (`saveCard`), it is already enforced there at runtime, and `types.ts` already documents format invariants in a comment (the `ThemeTokenName` note). Add the same style of comment on `Card.due`.

**Revisit if** a second producer of `due` appears (import, API, persistence) — then the cast count justifies a parser.

## Data Flow

```
  seed.ts ('2026-09-18')
       │
       ▼
  Card.due (ISO | '')
       │                                    ┌── TaskCard ──formatDueDate──> "18 sep" | "Sin fecha"
       ├────────────────────────────────────┘
       │
  draftFromCard (verbatim copy)
       │
       ▼
  TaskDraft.due (ISO | '') ──value──> <input type="date"> ──onChange(ISO|'')──┐
       ▲                                                                      │
       └──────────────────────── updateDraft ─────────────────────────────────┘
       │
  handleSave ──isValidDueDate(draft.due)──> false ──> "Fecha límite inválida" (modal stays open)
       │ true
       ▼
  saveCard: due = draft.due.trim()      // no 'Sin fecha' sentinel
```

## Sequence: Edit round-trip (the flow the old format broke)

```
TaskCard   KanbanBoard   useTaskModal   TaskModal   <input date>   validation   board
   │            │              │            │            │             │          │
 click ────────>│ openEdit(col, card)       │            │             │          │
   │            │─────────────>│ draft.due = card.due ('2026-09-18')   │          │
   │            │              │───draft───>│ value='2026-09-18' ─────>│          │
   │            │              │            │        (picker pre-filled)          │
   │            │              │            │<── change '2026-09-25' ──│          │
   │            │              │<─updateDraft({due})    │             │          │
   │            │              │            │ Guardar ──isValidDueDate─>│          │
   │            │              │            │<────── true ─────────────│          │
   │            │              │            │──onSave──> saveCard(board, draft) ──>│
   │            │              │            │            │             │  due=ISO │
   │<─── re-render: formatDueDate('2026-09-25') = "25 sep" ────────────────────────│
```

Under the old text field this pre-fill step was lossless only by accident; with the native control any non-ISO stored value would blank the picker, which is why the sentinel had to leave the domain.

## File Changes

| File | Action | Description |
|---|---|---|
| `src/features/kanban/domain/validation.ts` | Modify | Delete `MONTH_INDEX`, `NAMED_MONTH_PATTERN`, `NUMERIC_PATTERN`; require `year` in `daysInMonth`/`isValidCalendarDay`; ISO-only `isValidDueDate`; rewrite the JSDoc |
| `src/features/kanban/domain/presentation.ts` | Modify | Add `MONTH_ABBR` + exported `formatDueDate(iso: string): string` |
| `src/features/kanban/domain/board.ts` | Modify | Line 34 → `const due = draft.due.trim()`. Line 33 (`'Sin asignar'`) is **out of scope and unchanged** |
| `src/features/kanban/domain/seed.ts` | Modify | Six values → `2026-09-18`, `2026-09-22`, `2026-09-15`, `2026-09-19`, `2026-09-13`, `2026-09-10` |
| `src/features/kanban/domain/types.ts` | Modify | Comment on `Card.due` / `TaskDraft.due` pinning the ISO-or-empty invariant. No type change |
| `src/features/kanban/ui/TaskCard.tsx` | Modify | `{formatDueDate(card.due)}` at line 38 |
| `src/features/kanban/ui/TaskModal.tsx` | Modify | `type="date"`, drop `placeholder` |
| `validation.test.ts`, `board.test.ts`, `seed.test.ts`, `search.test.ts`, `useBoard.test.ts`, `useTaskModal.test.ts`, `TaskModal.test.tsx` | Modify | Old-format fixtures and assertions |

## Interfaces / Contracts

```ts
// domain/presentation.ts
// '2026-09-18' -> '18 sep' ; '' -> 'Sin fecha'
// A malformed value is returned unchanged, never crashed on — the caller is a render path.
export function formatDueDate(iso: string): string

// domain/validation.ts — signature unchanged, accepted domain narrowed to ISO | ''
export function isValidDueDate(value: string): boolean
```

`formatDueDate` strips the leading zero from the day (`2026-09-08` → `8 sep`), matching the seed's `10 sep` style. It performs no `Date` construction — pure string slicing plus an array lookup, so no timezone can shift the day.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | `isValidDueDate`: `''`/whitespace true; valid ISO true; `2028-02-29` true, `2025-02-29` false; **each removed format now false** (`20 sep`, `20 septiembre`, `20/09`, `20/09/2026`); `2026-13-01`, `2026-00-10`, `2026-09-31` false | Vitest, table-driven. RED first: the four removed-format rows currently pass as `true` |
| Unit | `formatDueDate`: each of the 12 months; `''` → `Sin fecha`; leading-zero day; malformed input returned unchanged | Vitest, no React |
| Unit | `saveCard` with blank `due` stores `''`, **not** `'Sin fecha'`; blank `assigneeName` still stores `'Sin asignar'` (regression guard on the out-of-scope line) | Vitest |
| Unit | `seedBoard()` — every `due` matches `/^\d{4}-\d{2}-\d{2}$/` | Vitest |
| Integration | Modal renders a date control; edit pre-fills it; create with a date shows `18 sep` on the card; create with blank shows `Sin fecha` | RTL |
| Integration | `Fecha límite inválida` is unreachable via the control — drive the invalid value through the draft, not through typing | RTL |

**jsdom constraints on `<input type="date">` — plan for these now, not during apply:**

1. **Query by label, not role.** `<input type="date">` has no implicit ARIA role, so `getByRole('textbox', { name: 'Fecha límite' })` will not find it. Use `screen.getByLabelText('Fecha límite')`. The existing `htmlFor="task-due"` association already supports this.
2. **Set the value with `fireEvent.change(input, { target: { value: '2026-09-20' } })`, not `user-event.type()`.** `user-event` models real keystrokes against a segmented date widget that jsdom does not implement; typing produces partial or empty values. This is the one place in the suite where `fireEvent` is correct rather than a shortcut — leave a comment saying so, since every other interaction test uses `user-event`.
3. **Assert the value, not the picker.** `expect(input).toHaveValue('2026-09-20')`; there is no calendar UI to assert against.
4. **Do not assert jsdom's sanitization of an invalid value.** Whether jsdom blanks `value` for a malformed date is an implementation detail. The defensive-guard test must inject the bad value through the draft/props path and assert the error message, so it does not depend on that behavior.

Existing `TaskModal.test.tsx:95` (`accepts an ISO due date via the same field (loosened format...)`) loses its meaning — ISO is now the only format. Fold it into the main accept case rather than keeping a duplicate.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. In-browser React feature, in-memory state only.

## Migration / Rollout

No migration required. No persistence exists (verified in the proposal), so the only data with the old format is `seed.ts`, migrated in the same commit. Single PR, `git revert -m 1`.

## Open Questions

- [ ] Delta specs were being written in parallel with this design. If `task-management`'s narrowed requirement or `kanban-board`'s Card Presentation rule lands with a rule that contradicts a table above, the spec wins and this document must be revised.
