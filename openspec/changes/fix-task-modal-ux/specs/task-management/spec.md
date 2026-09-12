# Delta for Task Management

## MODIFIED Requirements

### Requirement: Title Validation on Save

When the title is empty or contains only whitespace, clicking Save MUST keep the modal open, MUST display the inline error text "Título requerido" on the title field, and MUST NOT create or update any card. This error MUST be evaluated together with due-date validation on the same Save click: if the title is blank/whitespace AND the due value is invalid, BOTH inline errors ("Título requerido" and "Fecha límite inválida") MUST be shown at once.

(Previously: saving with a blank/whitespace title silently discarded the change and closed the modal as if the save had succeeded; only one error — the due-date error — could ever surface, because the blank-title path returned before due-date validation ran.)

#### Scenario: Blank title on create keeps the modal open

- GIVEN the create modal with an empty title
- WHEN Save is clicked
- THEN the modal MUST remain open, "Título requerido" MUST be shown, and no card MUST be added

#### Scenario: Whitespace-only title on edit keeps the modal open

- GIVEN the edit modal for an existing card with the title field cleared to "   "
- WHEN Save is clicked
- THEN the modal MUST remain open, "Título requerido" MUST be shown, and the original card MUST remain unchanged

#### Scenario: Blank title and invalid due date both surface

- GIVEN the create modal with an empty title and due input "31 sep"
- WHEN Save is clicked
- THEN both "Título requerido" and "Fecha límite inválida" MUST be shown, and no card MUST be added

## ADDED Requirements

### Requirement: Title Length Guidance

The title field MUST have no hard maximum length (no `maxLength` attribute); typing and pasting MUST NOT be truncated. A character counter MUST be visible next to the title field, in the form "n/80" where n is the current title length. The counter MUST enter a warning visual state once the title length exceeds 80 characters. Saving a title longer than 80 characters MUST still succeed, creating or updating the card with the full, untruncated title.

#### Scenario: Counter reflects current length

- GIVEN the title field is empty
- WHEN a title of 8 characters is typed
- THEN the counter MUST show "8/80" and MUST NOT be in a warning state

#### Scenario: Counter enters warning state past 80 characters

- GIVEN a title of exactly 80 characters
- WHEN one more character is typed (81 characters total)
- THEN the counter MUST enter its warning visual state

#### Scenario: Over-length title is not truncated and saves successfully

- GIVEN a title of 140 characters is pasted into the title field
- WHEN Save is clicked
- THEN the card MUST be saved with the full, untruncated 140-character title

### Requirement: Duplicate Title Warning

On a save attempt, if the target column (the column the card is being saved into) already contains another card whose title, trimmed, is identical to the draft's trimmed title — comparing CASE-SENSITIVELY, consistent with tag de-duplication in Field Defaults on Save — an inline non-blocking warning MUST be shown and the save MUST still proceed, creating or updating the card normally. A card being edited MUST NOT be compared against itself. Cards with the same title in a DIFFERENT column MUST NOT trigger this warning.

#### Scenario: Same-column duplicate warns but still saves

- GIVEN the "todo" column already has a card titled "Revisar PR"
- WHEN a new card titled "Revisar PR" is saved into "todo"
- THEN an inline warning MUST be shown and the new card MUST be added to "todo"

#### Scenario: Cross-column duplicate does not warn

- GIVEN "todo" has a card titled "Revisar PR" and "doing" has no card with that title
- WHEN a new card titled "Revisar PR" is saved into "doing"
- THEN no duplicate warning MUST be shown

#### Scenario: Editing a card without changing its title does not warn against itself

- GIVEN a card titled "Revisar PR" already in "todo"
- WHEN that same card is edited (its own title left unchanged) and saved back into "todo"
- THEN no duplicate warning MUST be shown

#### Scenario: Case-different titles are not treated as duplicates

- GIVEN "todo" has a card titled "Revisar PR"
- WHEN a new card titled "revisar pr" is saved into "todo"
- THEN no duplicate warning MUST be shown, consistent with case-sensitive comparison elsewhere in the spec
