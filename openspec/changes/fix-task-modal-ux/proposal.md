# Proposal: Fix Task Modal UX

**OpenSpec exemption**: Not exempt — adds behavior and replaces a shipped requirement.

**Baseline**: `openspec/specs/` is empty; live requirements sit in `openspec/changes/add-kanban-board/specs/`, which is unarchived with a FAIL verdict (one missing test for `Due-Date Format Validation` / "Error clears on further edit"). Not fixed here. `iso-due-date-picker` is in flight (proposal, design, deltas; no tasks).

## Intent

A live 22-step browser walkthrough of the create flow found 8 uncovered gaps (0 console errors). The modal is mouse-only and invisible to assistive tech: no autofocus, no Escape, no Enter-submit, no `role="dialog"`, no focus trap or restore. Worse, a blank title silently closes the modal as if the save succeeded (`TaskModal.tsx:48-52`), and a card created while the search box has text never appears, because `KanbanBoard` renders `filteredBoard` (`KanbanBoard.tsx:23,76`). Both read as data loss.

## Scope

### In Scope
- Focus `#task-title` on open; restore focus to the trigger on close.
- Escape closes; Enter submits (wrap fields in a `<form>`, `button type="submit"`).
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` on the heading (`TaskModal.tsx:78`).
- Focus trap: Tab/Shift+Tab stay inside the modal (today three Tabs reach the board search).
- Title length: a SOFT limit of 80 characters — a visible `n/80` counter that turns into a warning past 80. Typing and pasting are never truncated and an over-length title still saves (a 140-char title was accepted and stretched the card).
- Warn on a duplicate title in the target column; do not block.
- Keep a card visible after save when a search is active.
- **BREAKING**: blank/whitespace title keeps the modal OPEN with an inline title error, creating/updating nothing. Both existing scenarios and their tests are replaced. Title and due-date errors can then surface together — today `handleSave` returns before `isValidDueDate` (`TaskModal.tsx:48`).

### Out of Scope
- Persistence: the board lives in `useBoard` state seeded by `seed.ts`; reload wipes everything. Real limitation, separate change.
- Due-date format/picker — owned by `iso-due-date-picker`.
- Overlay-click discard and case-sensitive tag de-dup — spec-conformant, deliberately unchanged.
- Keyboard-operable cards (`role`/`tabIndex`) — already recorded out of scope by `add-kanban-board`.

## Capabilities

### New Capabilities
- `modal-accessibility`: dialog semantics, focus management (autofocus, trap, restore), and keyboard shortcuts (Escape, Enter).

### Modified Capabilities
- `task-management`: **Title Validation on Save** replaced (discard-and-close → keep-open with inline error); ADDED **Title Length Limit** and **Duplicate Title Warning**.
- `kanban-board`: **Search Filtering** — a just-saved card MUST NOT be hidden by the active query.

## Approach

Move draft validation into the domain: a pure `validateDraft(draft)` returning `{ titleError, dueError }` beside `validation.ts`. `TaskModal` renders both errors and calls `onSave` only when clean, so `KanbanBoard.handleSave` (`KanbanBoard.tsx:56-59`) closing right after `save()` stays correct without a success channel; `saveCard`'s blank-title guard (`board.ts:28`) stays as a defensive no-op. Focus/keyboard behavior lives in the `<form>` plus a small ref-based trap in `TaskModal`. Visibility after save: `KanbanBoard` clears `search` on a successful save when the saved title does not match the query. TDD is mandatory (`config.yaml: strict_tdd: true`).

## Proposal question round — ANSWERED

All four were put to the maintainer and answered. These are decisions, not defaults.

1. **Duplicate warning** — ANSWERED: inline, non-blocking, **same target column only**, raised on the save attempt. Cross-column duplicates are legitimate and MUST NOT warn.
2. **Title limit** — ANSWERED: **SOFT, not hard.** The maintainer rejected the proposed hard `maxLength=80`. No `maxLength` attribute. A visible `n/80` counter warns once the title exceeds 80 characters, and saving an over-length title MUST still succeed. Rationale: a hard cap silently truncates pasted text.
3. **Search after save** — ANSWERED: **clear the search box** when the just-saved card would not match the active query. It is the only option that actually reveals the card.
4. **Errors** — ANSWERED: **both at once.** Title and due-date errors render simultaneously. This is what closes the second blocker found in the walkthrough, where neither error surfaced.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/features/kanban/ui/TaskModal.tsx` | Modified | `<form>`, dialog ARIA, focus trap, title error, soft-limit counter (no `maxLength`), Escape |
| `src/features/kanban/ui/TaskModal.module.css` | Modified | Error/counter styles (reuse `.error`) |
| `src/features/kanban/ui/KanbanBoard.tsx` | Modified | Search clearing on save; focus restore target |
| `src/features/kanban/domain/validation.ts` | Modified | `validateDraft`, title rules |
| `src/features/kanban/domain/board.ts` | Unchanged | `saveCard` guard kept as defensive no-op |
| `src/features/kanban/ui/TaskModal.test.tsx`, `KanbanBoard.test.tsx` | Modified | Rewrite "modal MUST close" assertions; new a11y/keyboard tests |
| `openspec/changes/add-kanban-board/specs/task-management/spec.md` | Source | Requirement amended via delta, not edited in place |

## Rejected Alternatives

| Alternative | Why rejected |
|---|---|
| `save()` returns a success boolean through `useBoard` | Leaks a UI concern into the domain port for a case the UI already knows about |
| Keep the silent discard and only add a11y | The maintainer explicitly rejected it; it is the defect users read as data loss |
| Reuse the existing `dueError` local state for the title | Two ad-hoc flags drift; one pure validator keeps the rule in one place |
| Auto-block duplicate titles | Duplicates are legal; blocking invents a constraint the product never had |
| Native `<dialog>` element | Would rewrite overlay-click dismissal, a passing spec-conformant behavior |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Breaking change invalidates passing tests | Certain | Replace both scenarios in the delta; rewrite tests first (TDD) |
| Conflict with `iso-due-date-picker` on `TaskModal.tsx`/`validation.ts` | High | Touch the due field only through `validateDraft`; sequence the merges |
| Focus trap regresses select/overlay interaction | Med | Cover Tab order and overlay dismissal in tests |
| Clearing search surprises the user mid-filter | Med | Question 3; only clears when the card would be hidden |

## Rollback Plan

Single PR, no persisted state: `git revert -m 1 <merge-commit>` restores the previous behavior losslessly. If only the breaking title rule is contested, revert the `task-management` delta and its tests; the `modal-accessibility` work is independent.

## Dependencies

- None. No new packages.
- Soft ordering with `iso-due-date-picker` (shared files, not shared requirements).

## Success Criteria

- [ ] `pnpm test`, `pnpm build`, `pnpm lint` clean.
- [ ] Modal opens with the title focused; Escape closes; Enter saves; focus returns to the trigger.
- [ ] Tab cycles inside the modal; screen readers announce a dialog named by its heading.
- [ ] Blank title keeps the modal open with an inline error and creates nothing.
- [ ] A card saved under an active search is visible immediately.
- [ ] Over-length titles are flagged by the counter but still save; same-column duplicate titles warn without blocking.
