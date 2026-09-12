# Card Drag and Drop Specification

## Purpose

Defines HTML5 drag-and-drop behavior for moving cards across columns and reordering them within a column, including the corrected defect where an active search filter must not distort the real insertion index.

## Requirements

### Requirement: Drag Start Tracking

Starting a drag on a card MUST record that card's id and source column id as the active drag operation.

#### Scenario: Drag start records source

- GIVEN a card in column "todo"
- WHEN the user starts dragging it
- THEN the system MUST record its id and "todo" as the drag source

### Requirement: Cross-Column Move

Dropping a dragged card onto a target card in a DIFFERENT column MUST remove it from its source column and insert it into the target column at the target card's real (pre-removal) index.

#### Scenario: Move to another column

- GIVEN card A in "todo" and column "doing" = [X, Y]
- WHEN A is dropped onto Y (real index 1)
- THEN "todo" MUST no longer contain A and "doing" MUST become [X, A, Y]

### Requirement: Drop on Column Background

Dropping a dragged card onto a column's empty background area (not onto a card) MUST append it to the end of that column's real (unfiltered) card array, regardless of any active search filter.

#### Scenario: Drop on empty area appends

- GIVEN column "done" = [P, Q] and card A dragged from "todo"
- WHEN A is dropped on the "done" column background
- THEN "done" MUST become [P, Q, A]

### Requirement: Same-Column Reorder Ordering Outcome

When a dragged card is dropped onto a target card within the SAME column, the resulting order MUST place the dragged card immediately before the target card, with every other card retaining its relative order. This MUST hold regardless of whether the drag moves the card earlier or later in the column.

#### Scenario: Drag downward within the same column

- GIVEN column = [A, B, C, D]
- WHEN A is dropped onto C
- THEN the column MUST become [B, A, C, D]

#### Scenario: Drag upward within the same column

- GIVEN column = [A, B, C, D]
- WHEN D is dropped onto B
- THEN the column MUST become [A, D, B, C]

#### Scenario: Drop on self is a no-op

- GIVEN column = [A, B, C]
- WHEN A is dragged and dropped onto itself
- THEN the column order MUST remain [A, B, C] unchanged

### Requirement: Filtered-Index Resolution

(Previously: the per-card drop handler passed the index within the search-filtered list into a move operation that spliced into the unfiltered array, corrupting the target position. Fixed here.)

Regardless of an active search filter, the drop target MUST resolve to the target card's real index in the column's unfiltered array before any move or reorder math is applied.

#### Scenario: Reorder under an active filter

- GIVEN unfiltered column = [A, B, C, D] and a search query that hides A and C, showing only [B, D]
- WHEN B is dragged and dropped onto D
- THEN the system MUST use D's real index (3), not its filtered index (1), and the column MUST become [A, C, B, D]

#### Scenario: Cross-column move under an active filter

- GIVEN column "doing" is filtered to show only 1 of its 3 real cards
- WHEN a card from "todo" is dropped onto that visible card
- THEN the insertion MUST use the visible card's real index in "doing", not its filtered index
