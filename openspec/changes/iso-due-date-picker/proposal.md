# Proposal: ISO Due Date Picker

**OpenSpec exemption**: Not exempt — narrows a shipped requirement and changes a stored domain value.

**Baseline note**: `openspec/specs/` does not exist yet; `add-kanban-board` is unarchived. The requirements amended here currently live in `openspec/changes/add-kanban-board/specs/`.

## Intent

"Fecha límite" is free text (`TaskModal.tsx:160`) validated against four formats (`validation.ts:72`), so users hand-type dates and hit "Fecha límite inválida" on near-misses like "20 sept". The user asked for a native date picker. `<input type="date">` only reads and emits `YYYY-MM-DD`, so `due` becomes canonically ISO and the Spanish short form (`18 sep`) becomes presentation.

## Scope

### In Scope
- `due` is ISO `YYYY-MM-DD`, or `''` for no date. `<input type="date">` replaces the text input.
- ISO→Spanish display formatter for `TaskCard` (`2026-09-18` → `18 sep`); empty → `Sin fecha`.
- `isValidDueDate` narrows to ISO-only (empty still valid).
- `seed.ts` migrates its six values to ISO.
- Update every test encoding the old format; add tests for ISO validation, the formatter, and the native control.

### Out of Scope
- Persistence/migration: no `localStorage` or any storage exists in this repo (verified), so there is nothing to migrate.
- Date semantics: timezones, `Date` objects, relative dates, overdue highlighting, min/max, locale switching.
- Changing any other modal field.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `task-management`: **Due-Date Format Validation** narrows from four accepted formats to ISO-only (breaking); **Field Defaults on Save** stops storing the literal `'Sin fecha'` in `due` (`board.ts:34`) and stores `''` instead.
- `kanban-board`: **Card Presentation** — due text is now derived from the ISO value, not rendered raw.

## Approach

Keep the format rule in the domain. Add a pure `formatDueDate(iso): string` beside `presentation.ts`; `TaskCard` calls it. `'Sin fecha'` moves from stored value to formatter output, so the domain holds one format only. Validation still guards `due`, since non-ISO values can reach the domain from seed or draft code even though the control cannot emit them. TDD per `config.yaml` (`tdd: true`).

## Assumptions Needing User Confirmation

1. Blank due stores `''`; `Sin fecha` is display-only. (Keeping `'Sin fecha'` stored was rejected: it reintroduces a second format.)
2. `Fecha límite inválida` is **kept** as a defensive guard, unreachable by typing.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/kanban/domain/validation.ts` | Modified | ISO-only |
| `src/features/kanban/domain/presentation.ts` | Modified | `formatDueDate` |
| `src/features/kanban/domain/board.ts` | Modified | Drop `'Sin fecha'` default |
| `src/features/kanban/domain/seed.ts` | Modified | ISO values |
| `src/features/kanban/ui/TaskCard.tsx` | Modified | Format on render |
| `src/features/kanban/ui/TaskModal.tsx` | Modified | `type="date"` |
| `**/*.test.*` (6 files) | Modified | Old-format fixtures |

## Rejected Alternatives

| Alternative | Why rejected |
|---|---|
| Keep `type="text"` with a date mask | Does not deliver the requested native picker; keeps hand-typing and the error path |
| Accept all four formats, normalize to ISO on save | The control cannot render a non-ISO value on edit, so pre-fill silently blanks |
| Store the Spanish form, convert on open | Two-way lossy parsing; year is unrecoverable from `18 sep` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Year-less seed data forces an invented year | High | Pick one explicit year in the spec; state it |
| `'Sin fecha'` fed to a date input warns/blanks | Med | Remove the sentinel from the domain (assumption 1) |
| Narrowing breaks a shipped requirement | Accepted | User-approved; recorded as MODIFIED deltas |

## Rollback Plan

Single PR: `git revert -m 1 <merge-commit>`. No persisted state exists, so revert is lossless.

## Dependencies

- None. No new packages.

## Success Criteria

- [ ] `pnpm test`, `pnpm build`, `pnpm lint` clean.
- [ ] "Fecha límite" renders a native date picker.
- [ ] Cards show `18 sep`; blank shows `Sin fecha`.
- [ ] Editing a card pre-fills the picker with its date.
- [ ] `isValidDueDate` rejects every non-ISO format.
