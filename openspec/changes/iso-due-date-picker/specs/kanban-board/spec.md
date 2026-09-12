# Delta for Kanban Board

## ADDED Requirements

### Requirement: Due-Date Display Formatting

The system MUST render each card's due text through a pure display formatter, `formatDueDate`, which maps the stored ISO `due` value to a short Spanish form for presentation only; it MUST NOT mutate the stored value.

- A valid ISO `YYYY-MM-DD` value MUST format as `<day> <spanish abbreviation>` (no leading zero on day).
- Month abbreviations, indexed 1-12, MUST be: ene, feb, mar, abr, may, jun, jul, ago, sep, oct, nov, dic.
- An empty string MUST format as "Sin fecha".
- A value that is neither empty nor valid ISO (reachable only via seed or draft data, never the native control) MUST format as "Fecha límite inválida", matching the defensive validation guard.

#### Scenario: ISO date formats to short Spanish form

- GIVEN due "2026-09-18"
- WHEN the card renders
- THEN the due text MUST show "18 sep"

#### Scenario: Empty due formats to the placeholder

- GIVEN due `''`
- WHEN the card renders
- THEN the due text MUST show "Sin fecha"

#### Scenario: Non-ISO due formats to the defensive error text

- GIVEN a due value that is neither empty nor valid ISO (e.g. reached via seed or draft data)
- WHEN the card renders
- THEN the due text MUST show "Fecha límite inválida"

#### Scenario: Seed dates migrate to ISO and format back to their original text

- GIVEN the seeded cards now hold ISO `due` values
- WHEN each renders
- THEN the due text MUST match:

| Card | Stored ISO due | Rendered due text |
|---|---|---|
| 1 | 2026-09-18 | 18 sep |
| 2 | 2026-09-22 | 22 sep |
| 3 | 2026-09-15 | 15 sep |
| 4 | 2026-09-19 | 19 sep |
| 5 | 2026-09-13 | 13 sep |
| 6 | 2026-09-10 | 10 sep |

## MODIFIED Requirements

### Requirement: Card Presentation

Each card MUST show, in order: tag chips, title, assignee avatar with due text, and a priority badge.

- Tag chip color MUST be selected by hashing the tag string and indexing a 6-entry palette (a separate palette per theme).
- Avatar MUST show up to 2 uppercase initials (first letter of the first and second name parts) and a background color selected by hashing the assignee's full name into a 6-entry palette, independent of theme.
- Priority badge text MUST be "Alta", "Media", or "Baja" with fixed colors that do NOT change between light and dark theme.
- Due text MUST be the output of `formatDueDate` (see Due-Date Display Formatting) applied to the card's stored ISO `due` value — it MUST NOT render the raw stored value directly.
(Previously: due text was rendered as the raw stored string with no formatting step.)

#### Scenario: Same tag always gets the same color

- GIVEN two cards both tagged "Backend"
- WHEN they render in the same theme
- THEN both "Backend" chips MUST use the identical background/foreground pair

#### Scenario: Assignee with a single name word

- GIVEN an assignee name with only one word, e.g. "Ana"
- WHEN the avatar renders
- THEN initials MUST show "A"

#### Scenario: Due text is derived, not raw

- GIVEN a card with stored due "2026-09-13"
- WHEN the card renders
- THEN the visible due text MUST be "13 sep", not "2026-09-13"
