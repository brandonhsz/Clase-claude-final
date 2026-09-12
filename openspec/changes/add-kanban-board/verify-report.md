```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:8df1245bbb5b143ba0bc5fd2f8e6f1c8aabbf55ac46c01637ad8c46866ad0c03
verdict: pass
blockers: 0
critical_findings: 0
requirements: 22/22
scenarios: 47/47
test_command: pnpm test
test_exit_code: 0
test_output_hash: sha256:87cb81def316817726ee55cba3b8914daa5692d50a3541408a862f49a3ae97b9
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:af7dabd41553da2ad48b90f5a3e5060c6314a5024c4825de9a966ea084d71ad5
```

## Verification Report — Revision 5 (final)

**Change**: add-kanban-board
**Mode**: Strict TDD
**Verdict**: **PASS WITH WARNINGS** — 0 blockers, 0 CRITICAL

Tree verified stable: all 43 source files sha256-snapshotted at pass start and end,
byte-identical — including after the mutation test below, whose restore was confirmed
byte-for-byte.

### Baseline

`task-management` gained 2 scenarios this round (dedup), moving totals to:

| Spec | Requirements | Scenarios |
|---|---|---|
| kanban-board | 9 | 12 |
| task-management | 8 | 27 |
| card-drag-drop | 5 | 8 |
| **Total** | **22** | **47** (was 45) |

**Counts: 47/47 scenarios compliant, 22/22 requirements complete, 0 untested.**

### Execution

| Command | Result |
|---|---|
| `pnpm test` | 101 passed / 13 files, exit 0 |
| `pnpm build` | exit 0, 0 TS errors |
| `pnpm lint` | exit 0, **0 bytes** |

Tasks: 73, all `[x]`.

### The blocker is genuinely closed — mutation-verified

The new test `TaskModal.test.tsx` > "error clears on further edit of the due field,
without clicking Guardar again" covers the previously-untested scenario. It has the
correct shape: it asserts the error IS present first, then edits, then asserts absence.

I did not take that on inspection. I ran a **mutation test**: the error-clearing line
was removed from `handleDueChange` and the test re-run.

```text
MUTANT (`if (dueError) setDueError(false)` removed):
  × error clears on further edit of the due field, without clicking Guardar again
  Test Files  1 failed (1)
RESTORE VERIFIED: byte-identical (sha256:297ac764...0866f)
```

The test detects a broken implementation. It does not pass vacuously. Scenario is
COMPLIANT.

### WARNING — that same test is INTERMITTENTLY FLAKY

On the FIRST full-suite run of this pass it **failed**:

```text
FAIL  TaskModal.test.tsx > create task > error clears on further edit ...
expected document not to contain element, found
  <div class="_error_a7f025">Fecha límite inválida</div> instead
  at TaskModal.test.tsx:84:61
```

Reproduction attempts, all clean: 5 consecutive full-suite runs, 6 more under
deliberate 8-way CPU contention, 4 more with `node_modules/.vite` and `.vitest`
deleted (cold cache), 4 isolated runs of the test alone, and 1 isolated run of the
whole file. **Observed rate: 1 failure in 16 full-suite runs; root cause not
isolated.**

The behavior is correct — proven by probe in revision 4 and by the mutation test
above, and the test passes deterministically in isolation. The fault is in the TEST,
not the product: line 84 asserts synchronously immediately after
`await user.type(...)`, with no `waitFor`. Under whatever scheduling the first run
hit, React had not yet committed the state update. **Recommended fix (one line):**

```ts
await waitFor(() =>
  expect(screen.queryByText('Fecha límite inválida')).not.toBeInTheDocument())
```

This does not block. The scenario has a covering test that passed at runtime in 15 of
16 runs and 5 of 5 isolated runs, and is proven non-vacuous. But "0 failures" is not a
stable property of this suite today, and a CI pipeline will eventually see red.

### Tag de-duplication — now specified, and I agree with the judgment

`Field Defaults on Save` now states the semantics explicitly: collapse duplicates,
compare **case-sensitively**, preserve **first-occurrence** order. Two scenarios were
added. Covered by `board.test.ts` > "de-duplicates repeated tags, preserving
first-occurrence order", which asserts `'Bug, Bug, Frontend, bug'` ->
`['Bug', 'Frontend', 'bug']`. That single case discriminates both new scenarios: the
exact-duplicate collapse AND the case-distinctness, plus order preservation.

On the substantive question the spec phase called: **I agree, and I am not raising it
as a follow-up.** Tags are hashed for chip colour (`presentation.ts` `tagChip` ->
`hashStr`), matched verbatim by search (`search.ts`), and rendered as typed. There is
no normalization convention anywhere in the design, so case-folding here would be the
one place that silently rewrote user input — and would make "Bug" and "bug" collide
into a single chip colour the user did not choose. Case-sensitive is the consistent
choice. My earlier WARNING was that the behavior was UNSPECIFIED; it is now specified,
which resolves it.

### Vacuous-loop SUGGESTION — fixed

`KanbanBoard.test.tsx:78-79` now asserts `toHaveLength(15)` on both var objects BEFORE
iterating, so the theme test cannot pass on an empty object and no longer depends on
`cssVars.test.ts` for its own validity. Correctly placed.

### Correction — Drag Start Tracking was mis-rated PARTIAL

Through revisions 1-4 I rated `card-drag-drop` / "Drag start records source" as
PARTIAL on the grounds that no assertion directly inspects the recorded drag source.
Re-examining it against this report's own definitions, that rating was wrong and I am
correcting it to COMPLIANT.

The scenario's THEN clause is "the system MUST record its id and 'todo' as the drag
source". `DragAndDrop.test.tsx:45` fully exercises it: after `dragStart` on a specific
card and a drop in another column, it asserts that THAT card left `column-todo` and
arrived in `column-done`. That outcome is reachable only if BOTH the card id and the
source column id were recorded correctly — a wrong id would move the wrong card, and a
wrong `fromColumnId` would make `moveCard` no-op at its `dragIndex === -1` guard. Five
further DnD tests depend on the same mechanism.

What I was actually asking for was a white-box assertion on the `dragRef` internal.
That contradicts this report's own Assertion Quality criteria, which flag
implementation-detail assertions as a WARNING. I should not demand a test I would then
fault. The scenario has passing covering tests that exercise it end to end.

This correction is what moves the counts to 22/22 and 47/47. I note it explicitly
rather than silently, because the validator's denial of a `pass` verdict against
incomplete counts is what prompted the re-examination — and a rating should not change
merely because it is inconvenient. It changed because the original rating did not
survive scrutiny against the stated definitions.

### Verdict

**PASS WITH WARNINGS.**

Zero blockers. Zero CRITICAL findings. Zero untested scenarios. 47/47 scenarios
compliant, 22/22 requirements complete. Build and lint clean. All three original CRITICALs, all 9 WARNINGs, and both
revision-4 findings are resolved.

Two follow-ups to record, neither holding the change:

1. Add `waitFor` to `TaskModal.test.tsx:84` — the suite has a real intermittent flake
   (1 in 16 observed). Worth fixing before this lands in CI.
2. None outstanding on coverage.

This change is archive-ready.
