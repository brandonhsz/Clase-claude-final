# Kanban Board Specification

## Purpose

Defines the board layout, header, column structure, card presentation, search filtering, and light/dark theming for "Proyecto Aurora". Behavior only — no implementation details.

## Requirements

### Requirement: Header Controls

The system MUST render a header containing: a logo mark, title "Proyecto Aurora", subtitle "Tablero de gestión de tareas", a search input, a theme-toggle button, and a "+ Nueva tarea" button.

#### Scenario: Header renders on load

- GIVEN the board mounts
- WHEN initial render completes
- THEN the header MUST show the title, subtitle, search input, theme toggle, and "+ Nueva tarea" button

### Requirement: Column Structure

The system MUST render exactly 4 fixed columns, in this order, each 290px wide, inside a horizontally scrollable row.

| id | name | accent |
|---|---|---|
| todo | Por hacer | oklch(0.62 0.23 300) |
| doing | En progreso | oklch(0.62 0.2 250) |
| review | Revisión | oklch(0.75 0.19 70) |
| done | Hecho | oklch(0.7 0.16 165) |

#### Scenario: Columns render in fixed order

- GIVEN the board mounts
- WHEN columns render
- THEN the 4 columns MUST appear in this order with their exact name and accent color

### Requirement: Initial Board State

The system MUST seed the board with 6 tasks distributed as: todo (2), doing (2), review (1), done (1).

#### Scenario: Seed cards present on first load

- GIVEN no prior state exists
- WHEN the board mounts
- THEN todo MUST contain 2 cards, doing 2 cards, review 1 card, done 1 card

### Requirement: Card Count Badge

The column count badge MUST reflect the number of cards currently visible after search filtering, not the column's total card count.

#### Scenario: Badge updates under an active filter

- GIVEN a column has 3 cards and a search query matches only 1 of them
- WHEN the query is applied
- THEN the column's badge MUST show 1

### Requirement: Empty Column State

The system MUST show "Sin tareas" in a column when it has zero cards after filtering, and MUST NOT show it otherwise.

#### Scenario: Filter empties a column

- GIVEN a column has cards, none matching the active search query
- WHEN the query is applied
- THEN the column MUST show "Sin tareas" and no card items

### Requirement: Add Task Entry Points

The system MUST provide a "+ Añadir tarea" button in each column and a "+ Nueva tarea" button in the header, both opening the create-task modal.

#### Scenario: Column button preselects its column

- GIVEN the "doing" column
- WHEN its "+ Añadir tarea" button is clicked
- THEN the create modal MUST open with "doing" preselected

#### Scenario: Header button defaults to first column

- WHEN "+ Nueva tarea" is clicked
- THEN the create modal MUST open with the first column ("todo") preselected

### Requirement: Card Presentation

Each card MUST show, in order: tag chips, title, assignee avatar with due text, and a priority badge.

- Tag chip color MUST be selected by hashing the tag string and indexing a 6-entry palette (a separate palette per theme).
- Avatar MUST show up to 2 uppercase initials (first letter of the first and second name parts) and a background color selected by hashing the assignee's full name into a 6-entry palette, independent of theme.
- Priority badge text MUST be "Alta", "Media", or "Baja" with fixed colors that do NOT change between light and dark theme.

#### Scenario: Same tag always gets the same color

- GIVEN two cards both tagged "Backend"
- WHEN they render in the same theme
- THEN both "Backend" chips MUST use the identical background/foreground pair

#### Scenario: Assignee with a single name word

- GIVEN an assignee name with only one word, e.g. "Ana"
- WHEN the avatar renders
- THEN initials MUST show "A"

### Requirement: Search Filtering

The system MUST filter cards, independently per column, by case-insensitive substring match against the card's title, any of its tags, or its assignee's name.

#### Scenario: Match by tag

- GIVEN a card tagged "API" and a search query "api"
- WHEN the query is applied
- THEN the card MUST remain visible

#### Scenario: No match hides the card

- GIVEN a card titled "Configurar CI/CD" with assignee "Diego Ruiz"
- WHEN the search query is "backend"
- THEN the card MUST NOT be visible in its column

### Requirement: Light/Dark Theming

The system MUST support a light and a dark token set, switched by the theme-toggle button, applied to all themed surfaces (page background, text colors, panel/card/input/modal backgrounds, borders, badges, overlay).

#### Scenario: Toggle switches theme

- GIVEN the board is in light theme
- WHEN the theme-toggle button is clicked
- THEN all themed surfaces MUST switch to the dark token values, and clicking again MUST restore the light values
