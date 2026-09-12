import type { Board, Card } from './types.ts'

export function matchesQuery(card: Card, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return (
    card.title.toLowerCase().includes(q) ||
    card.tags.some((t) => t.toLowerCase().includes(q)) ||
    card.assignee.name.toLowerCase().includes(q)
  )
}

export function filterBoard(board: Board, query: string): Board {
  return board.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => matchesQuery(card, query)),
  }))
}
