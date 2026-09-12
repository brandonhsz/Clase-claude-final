# Delta for Task Management

## MODIFIED Requirements

### Requirement: Due-Date Format Validation

The "Fecha límite" field is a native `<input type="date">` control, which can only emit an empty string or ISO 8601 `YYYY-MM-DD`. `isValidDueDate` MUST accept only two forms as valid: an empty (or whitespace-only) value, and a string matching `YYYY-MM-DD` with a day in range for that month. Because ISO always carries a year, February 29 MUST be validated against that year's actual leap-year status (divisible by 4, and not by 100 unless also by 400) — there is no year-less input from this control, so the year-less leap-day allowance no longer applies. Every previously accepted non-ISO form (Spanish month name/abbreviation, bare `DD/MM`, `DD/MM/YYYY`) MUST now be rejected.

Saving with an invalid due value MUST keep the modal open, MUST display the inline error text "Fecha límite inválida" exactly, and MUST NOT create or update any card. This guard remains defensive: the native control cannot emit a non-ISO value, but seed data or draft code can still assign one. The error MUST clear as soon as the user edits the due field again. Blank-title precedence is unchanged: an empty/whitespace title MUST discard the save (no card change, modal closes) before the due value is validated, and MUST NOT show the due error even if due is invalid. A saved due value MUST be stored exactly as received (trimmed of surrounding whitespace only); validation gates whether the save proceeds, it MUST NOT reformat or normalize the value. Editing an existing card MUST load its stored ISO value as the native control's value, pre-filling the picker.
(Previously: accepted four formats — Spanish month name/abbreviation, `DD/MM`, `DD/MM/YYYY`, ISO — with a year-less leap-day allowance for the three forms without a year.)

#### Scenario: ISO date accepted

- GIVEN due input "2026-09-20"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "2026-09-20"

#### Scenario: Empty due accepted

- GIVEN an empty due field
- WHEN Save is clicked with an otherwise valid draft
- THEN the card MUST be saved

#### Scenario: Feb 29 accepted for a leap year

- GIVEN due input "2028-02-29"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "2028-02-29"

#### Scenario: Feb 29 rejected for a non-leap year

- GIVEN due input "2025-02-29"
- WHEN Save is clicked
- THEN the modal MUST stay open and show "Fecha límite inválida"

#### Scenario: Previously accepted Spanish month name is now rejected

- GIVEN due input "20 septiembre"
- WHEN Save is clicked
- THEN the modal MUST stay open and show "Fecha límite inválida"

#### Scenario: Previously accepted bare DD/MM is now rejected

- GIVEN due input "20/09"
- WHEN Save is clicked
- THEN the modal MUST stay open and show "Fecha límite inválida"

#### Scenario: Error clears on further edit

- GIVEN the modal shows "Fecha límite inválida" after a rejected save attempt
- WHEN the user changes the due field again
- THEN the error text MUST disappear immediately, before any further Save click

#### Scenario: Blank title discards save regardless of due validity

- GIVEN an empty title and a due value that does not match ISO
- WHEN Save is clicked
- THEN no card MUST be saved, the modal MUST close, and "Fecha límite inválida" MUST NOT be shown

#### Scenario: Editing a card pre-fills the native control

- GIVEN a card with due "2026-09-18"
- WHEN its edit modal opens
- THEN the native date control's value MUST be "2026-09-18"

### Requirement: Field Defaults on Save

When assignee is blank, the saved card's assignee name MUST default to "Sin asignar" (unchanged by this change). When due is blank, the saved card's due value MUST default to the empty string `''`, not the literal "Sin fecha" — "Sin fecha" is display-only output produced by the formatter (see the kanban-board Due-Date Display Formatting requirement) and MUST NEVER be a stored value. Tags MUST be parsed by splitting on comma, trimming each entry, and discarding empty entries.
(Previously: blank due stored the literal string "Sin fecha".)

#### Scenario: Blank assignee and due

- GIVEN a valid title, blank assignee, and blank due
- WHEN Save is clicked
- THEN the card's assignee MUST be "Sin asignar" and due MUST be `''`

#### Scenario: Tag list trims and filters

- GIVEN tags input " Frontend ,, Bug "
- WHEN Save is clicked
- THEN the saved tags MUST be ["Frontend", "Bug"]
