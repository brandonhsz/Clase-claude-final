# Modal Accessibility Specification

## Purpose

Defines dialog semantics, focus management, and keyboard interaction for the task creation/edit modal (`TaskModal`), so mouse-only, keyboard, and assistive-technology users can operate it equivalently.

## Requirements

### Requirement: Dialog Semantics

The modal container MUST expose `role="dialog"` and `aria-modal="true"`, and MUST reference its heading element via `aria-labelledby` so the heading text ("Nueva tarea" or "Editar tarea") is the dialog's accessible name.

#### Scenario: Create modal exposes dialog role and name

- GIVEN the create modal is open
- WHEN the modal element is inspected
- THEN it MUST have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to an element containing the text "Nueva tarea"

#### Scenario: Edit modal exposes dialog role and name

- GIVEN the edit modal is open for an existing card
- WHEN the modal element is inspected
- THEN `aria-labelledby` MUST point to an element containing the text "Editar tarea"

### Requirement: Focus on Open

Opening the modal (create or edit, from any entry point) MUST move DOM focus to the title field (`#task-title`).

#### Scenario: Opening the create modal focuses the title field

- GIVEN the board is rendered with no modal open
- WHEN the create modal is opened
- THEN the title input MUST be the active (focused) element

#### Scenario: Opening the edit modal focuses the title field

- GIVEN an existing card is clicked to open the edit modal
- WHEN the modal finishes opening
- THEN the title input MUST be the active element, pre-filled with the card's current title

### Requirement: Focus Restore on Close

Closing the modal by any route — the "Cancelar" button, clicking the overlay, pressing Escape, or a successful save — MUST return DOM focus to the element that had focus immediately before the modal opened (the trigger element).

#### Scenario: Cancel restores focus to the trigger

- GIVEN the create modal was opened via the "+ Nueva tarea" header button
- WHEN "Cancelar" is clicked
- THEN the header's "+ Nueva tarea" button MUST become the active element again

#### Scenario: Successful save restores focus to the trigger

- GIVEN the edit modal was opened by clicking a card
- WHEN a valid save completes and the modal closes
- THEN the element that was focused before the modal opened MUST become the active element again

### Requirement: Keyboard Shortcuts

Pressing Escape while the modal is open MUST close it and discard unsaved field changes, equivalent to "Cancelar" (see `task-management`'s Cancel and Overlay Dismissal requirement). All single-line fields MUST be inside a `<form>` whose submit action MUST trigger the same save flow as clicking "Guardar"; pressing Enter in the description textarea MUST NOT submit the form (it MUST insert a newline instead).

#### Scenario: Escape discards and closes

- GIVEN the edit modal is open with an unsaved title change
- WHEN Escape is pressed
- THEN the modal MUST close and the card MUST remain unchanged

#### Scenario: Enter in a single-line field submits

- GIVEN the create modal with a valid title typed into the title field
- WHEN Enter is pressed while the title field is focused
- THEN the save flow MUST run, equivalent to clicking "Guardar"

#### Scenario: Enter in the description does not submit

- GIVEN the create modal with the description textarea focused
- WHEN Enter is pressed
- THEN the modal MUST remain open, a newline MUST be inserted into the description, and no save MUST occur

### Requirement: Focus Trap

While the modal is open, Tab from the last focusable element inside the modal MUST wrap to the first focusable element inside the modal, and Shift+Tab from the first MUST wrap to the last. Focus MUST NOT reach any element in the board behind the overlay while the modal is open.

#### Scenario: Tab wraps from last to first field

- GIVEN the modal is open and the last focusable element (the "Guardar" button) is focused
- WHEN Tab is pressed
- THEN focus MUST move to the first focusable element inside the modal, not to any element outside it

#### Scenario: Shift+Tab wraps from first to last field

- GIVEN the modal is open and the title field (first focusable element) is focused
- WHEN Shift+Tab is pressed
- THEN focus MUST move to the last focusable element inside the modal

#### Scenario: Repeated Tab never escapes to the board

- GIVEN the modal is open and the tags field is focused
- WHEN Tab is pressed three times in a row
- THEN focus MUST stay within the modal's focusable elements and MUST NOT land on the board's search input
