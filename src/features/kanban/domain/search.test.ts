import { describe, expect, it } from 'vitest'
import { filterBoard, matchesQuery } from './search.ts'
import type { Board, Card } from './types.ts'

function makeCard(overrides: Partial<Card>): Card {
  return {
    id: 1,
    title: 'Configurar CI/CD',
    desc: '',
    tags: ['DevOps'],
    assignee: { name: 'Diego Ruiz' },
    due: '10 sep',
    priority: 'Baja',
    ...overrides,
  }
}

describe('matchesQuery', () => {
  it('matches by title, case-insensitively', () => {
    expect(matchesQuery(makeCard({ title: 'Integrar API' }), 'api')).toBe(true)
  })

  it('matches by tag, case-insensitively', () => {
    expect(matchesQuery(makeCard({ tags: ['API'] }), 'api')).toBe(true)
  })

  it('matches by assignee name, case-insensitively', () => {
    expect(matchesQuery(makeCard({ assignee: { name: 'Diego Ruiz' } }), 'diego')).toBe(true)
  })

  it('returns false when nothing matches', () => {
    const card = makeCard({ title: 'Configurar CI/CD', assignee: { name: 'Diego Ruiz' } })
    expect(matchesQuery(card, 'backend')).toBe(false)
  })

  it('treats an empty query as matching everything', () => {
    expect(matchesQuery(makeCard({}), '')).toBe(true)
  })
})

describe('filterBoard', () => {
  const board: Board = [
    {
      id: 'todo',
      name: 'Por hacer',
      accent: 'oklch(0.62 0.23 300)',
      cards: [makeCard({ id: 1, title: 'API card' }), makeCard({ id: 2, title: 'Other' })],
    },
    {
      id: 'doing',
      name: 'En progreso',
      accent: 'oklch(0.62 0.2 250)',
      cards: [makeCard({ id: 3, title: 'API two' })],
    },
  ]

  it('filters cards independently per column', () => {
    const filtered = filterBoard(board, 'api')
    expect(filtered.find((c) => c.id === 'todo')?.cards.map((c) => c.id)).toEqual([1])
    expect(filtered.find((c) => c.id === 'doing')?.cards.map((c) => c.id)).toEqual([3])
  })

  it('never mutates the input board', () => {
    const snapshot = JSON.stringify(board)
    filterBoard(board, 'api')
    expect(JSON.stringify(board)).toBe(snapshot)
  })
})
