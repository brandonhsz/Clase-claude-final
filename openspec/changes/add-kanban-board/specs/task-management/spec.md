# Task Management Specification

## Purpose

Defines creating, editing, deleting, and validating tasks via the task modal, including two corrected design defects (position preservation on edit, and title validation) and a maintainer-approved scope expansion: due-date format validation.

## Requirements

### Requirement: Create Task Modal

The system MUST open a modal titled "Nueva tarea" with empty fields: title, description, column (preselected per entry point), priority (default "Media"), assignee, due date, tags. It MUST NOT show a delete button.

#### Scenario: Create modal defaults

- WHEN the create modal opens
- THEN priority MUST default to "Media", all other fields MUST be empty, and no delete button MUST be shown

### Requirement: Edit Task Modal

The system MUST open a modal titled "Editar tarea" pre-filled with the clicked card's title, description, column, priority, assignee name, due, and tags joined by ", ". It MUST show a delete button.

#### Scenario: Edit modal pre-fill

- GIVEN a card with tags ["Backend", "API"]
- WHEN its card is clicked
- THEN the tags field MUST show "Backend, API" and a delete button MUST be visible

### Requirement: Title Validation on Save

Saving MUST discard the change and close the modal without creating or updating any card when the title is empty or contains only whitespace.

#### Scenario: Blank title discards create

- GIVEN the create modal with an empty title
- WHEN Save is clicked
- THEN no card MUST be added and the modal MUST close

#### Scenario: Whitespace-only title discards edit

- GIVEN the edit modal for an existing card with the title field cleared to "   "
- WHEN Save is clicked
- THEN the original card MUST remain unchanged and the modal MUST close

### Requirement: Field Defaults on Save

When assignee is blank, the saved card's assignee name MUST default to "Sin asignar". When due is blank, the saved card's due text MUST default to "Sin fecha". Tags MUST be parsed by splitting on comma, trimming each entry, and discarding empty entries. Duplicate tags MUST then be collapsed to a single occurrence, comparing tag strings CASE-SENSITIVELY (so "Bug" and "bug" are distinct tags, each kept), and preserving each surviving tag's ORIGINAL relative order — when a tag repeats, the FIRST occurrence's position is kept and later repeats are discarded.

#### Scenario: Blank assignee and due

- GIVEN a valid title, blank assignee, and blank due
- WHEN Save is clicked
- THEN the card's assignee MUST be "Sin asignar" and due MUST be "Sin fecha"

#### Scenario: Tag list trims and filters

- GIVEN tags input " Frontend ,, Bug "
- WHEN Save is clicked
- THEN the saved tags MUST be ["Frontend", "Bug"]

#### Scenario: Exact-duplicate tags collapse to one

- GIVEN tags input "Bug, Bug"
- WHEN Save is clicked
- THEN the saved card MUST have exactly one "Bug" tag

#### Scenario: Differently-cased tags are kept distinct

- GIVEN tags input "Bug, bug"
- WHEN Save is clicked
- THEN the saved tags MUST be ["Bug", "bug"] — both are kept because comparison is case-sensitive

### Requirement: Due-Date Format Validation

(USER DECISION — maintainer-approved scope expansion: the proposal originally excluded "real date handling". Format validation of the "Fecha límite" field is now in scope; actual date semantics — timezones, real `Date` objects, relative dates such as "mañana", overdue highlighting — remain out of scope.)

An empty or whitespace-only due value MUST be treated as valid (it defaults to "Sin fecha" per Field Defaults on Save). A non-empty due value MUST be accepted, case-insensitively and tolerant of extra internal whitespace, in any of these forms:

- `<day> <spanish month abbreviation>` (e.g. "20 sep")
- `<day> <full spanish month name>` (e.g. "20 septiembre")
- `DD/MM` or `DD/MM/YYYY` (e.g. "20/09", "20/09/2026")
- ISO `YYYY-MM-DD` (e.g. "2026-09-20")

The day MUST be validated as in-range for the named/numbered month (e.g. September, "sep"/"09", has 30 days). The leap-day rule for February 29 follows one principle, applied by whether the form carries a year: forms that carry NO year — `<day> <spanish month abbreviation>`, `<day> <full spanish month name>`, and bare `DD/MM` — MUST accept day 29 as a permanent leap-day allowance. Forms that DO carry a year — `DD/MM/YYYY` and ISO `YYYY-MM-DD` — MUST validate February 29 against that specific year's actual leap-year status (divisible by 4, and not by 100 unless also by 400); a year-bearing form asserts a real calendar date, so it MUST NOT grant the same blanket allowance as the year-less forms.

Saving with an invalid due value MUST keep the modal open, MUST display the inline error text "Fecha límite inválida" exactly, and MUST NOT create or update any card. The error MUST clear as soon as the user edits the due field again. A saved due value MUST be stored exactly as the user entered it (trimmed of surrounding whitespace only) — validation gates whether the save proceeds, it MUST NOT reformat or normalize the value.

#### Scenario: Abbreviated Spanish month accepted

- GIVEN due input "20 sep"
- WHEN Save is clicked with an otherwise valid draft
- THEN the card MUST be saved with due exactly "20 sep"

#### Scenario: Full Spanish month name accepted

- GIVEN due input "20 septiembre"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "20 septiembre"

#### Scenario: Numeric DD/MM accepted

- GIVEN due input "20/09"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "20/09"

#### Scenario: Numeric DD/MM/YYYY accepted

- GIVEN due input "20/09/2026"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "20/09/2026"

#### Scenario: ISO date accepted

- GIVEN due input "2026-09-20"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "2026-09-20"

#### Scenario: Case-insensitive and whitespace-tolerant

- GIVEN due input "  20  SEP  "
- WHEN Save is clicked
- THEN the card MUST be saved (the value is accepted as valid)

#### Scenario: Leap day accepted without a year (month name)

- GIVEN due input "29 feb"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "29 feb"

#### Scenario: Leap day accepted without a year (bare DD/MM)

- GIVEN due input "29/02"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "29/02"

#### Scenario: Day out of range for a named month is rejected

- GIVEN due input "31 sep"
- WHEN Save is clicked
- THEN the modal MUST stay open, MUST show "Fecha límite inválida", and no card MUST be saved

#### Scenario: Day zero is rejected

- GIVEN due input "0 sep"
- WHEN Save is clicked
- THEN the modal MUST stay open, MUST show "Fecha límite inválida", and no card MUST be saved

#### Scenario: Non-standard abbreviation is rejected

- GIVEN due input "20 sept"
- WHEN Save is clicked
- THEN the modal MUST stay open and show "Fecha límite inválida"

#### Scenario: Unrecognized text is rejected

- GIVEN due input "mañana"
- WHEN Save is clicked
- THEN the modal MUST stay open and show "Fecha límite inválida"

#### Scenario: Feb 29 rejected for a non-leap year when a year is present

- GIVEN due input "2025-02-29"
- WHEN Save is clicked
- THEN the modal MUST stay open and show "Fecha límite inválida", because 2025 is not a leap year

#### Scenario: Feb 29 accepted for a leap year when a year is present

- GIVEN due input "29/02/2028"
- WHEN Save is clicked
- THEN the card MUST be saved with due exactly "29/02/2028", because 2028 is a leap year

#### Scenario: Error clears on further edit

- GIVEN the modal shows "Fecha límite inválida" after a rejected save attempt
- WHEN the user changes the due field again
- THEN the error text MUST disappear immediately, before any further Save click

### Requirement: Position Preservation on Edit

(Previously: the design removed the card from every column then pushed it onto the target column, always moving it to the end. Fixed here.)

When editing an existing card and the selected column is UNCHANGED, saving MUST preserve the card's original position within that column. When the selected column IS changed, saving MUST remove the card from its original column and append it to the end of the new column.

#### Scenario: Edit without column change preserves position

- GIVEN column "doing" with cards [A, B, C] and B is edited with column left as "doing"
- WHEN Save is clicked with only the title changed
- THEN "doing" MUST remain [A, B', C] with the updated B' at index 1

#### Scenario: Edit with column change appends to end

- GIVEN card B in "doing" and "review" already containing [X]
- WHEN B is edited with column changed to "review" and saved
- THEN "doing" MUST no longer contain B and "review" MUST become [X, B]

### Requirement: Cancel and Overlay Dismissal

Clicking the overlay background or the "Cancelar" button MUST close the modal and MUST NOT persist any field changes made in that session.

#### Scenario: Overlay click discards edits

- GIVEN the edit modal open with an unsaved title change
- WHEN the overlay background is clicked
- THEN the modal MUST close and the card MUST remain unchanged

### Requirement: Delete Task

The delete button, shown only in edit mode, MUST remove the card from its column and close the modal without a confirmation dialog.

#### Scenario: Delete removes the card

- GIVEN the edit modal open for an existing card
- WHEN "Eliminar" is clicked
- THEN the card MUST no longer appear in its column and the modal MUST close
