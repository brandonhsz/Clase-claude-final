# Delta for Kanban Board

## MODIFIED Requirements

### Requirement: Search Filtering

The system MUST filter cards, independently per column, by case-insensitive substring match against the card's title, any of its tags, or its assignee's name. When a card is saved (created or edited) while a search query is active, if the saved card would NOT match that query, the search query MUST be cleared immediately after the save so the saved card is visible; if the saved card DOES match the active query, the query MUST be left unchanged.

(Previously: this requirement covered only matching semantics; it did not address a card becoming invisible immediately after being saved under an active, non-matching search query.)

#### Scenario: Match by tag

- GIVEN a card tagged "API" and a search query "api"
- WHEN the query is applied
- THEN the card MUST remain visible

#### Scenario: No match hides the card

- GIVEN a card titled "Configurar CI/CD" with assignee "Diego Ruiz"
- WHEN the search query is "backend"
- THEN the card MUST NOT be visible in its column

#### Scenario: Saving a non-matching card on create clears the search

- GIVEN an active search query "backend" that matches no card titled "Diseñar logo"
- WHEN a new card titled "Diseñar logo" is created and saved
- THEN the search query MUST be cleared and the new card MUST be visible

#### Scenario: Saving a non-matching card on edit clears the search

- GIVEN an active search query "backend" and an existing card is edited so its title becomes "Diseñar logo" (no longer matching "backend")
- WHEN Save is clicked
- THEN the search query MUST be cleared and the edited card MUST be visible

#### Scenario: Saving a matching card leaves the search untouched

- GIVEN an active search query "api" and a new card titled "Integrar API externa" is created
- WHEN Save is clicked
- THEN the search query MUST remain "api" and the new card MUST be visible
