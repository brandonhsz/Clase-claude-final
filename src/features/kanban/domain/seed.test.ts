import { describe, expect, it } from 'vitest'
import { seedBoard } from './seed.ts'

describe('seedBoard', () => {
  it('contains exactly 4 columns in fixed order, name, and accent', () => {
    const board = seedBoard()

    expect(board.map((c) => c.id)).toEqual(['todo', 'doing', 'review', 'done'])
    expect(board.map((c) => c.name)).toEqual([
      'Por hacer',
      'En progreso',
      'Revisión',
      'Hecho',
    ])
    expect(board.map((c) => c.accent)).toEqual([
      'oklch(0.62 0.23 300)',
      'oklch(0.62 0.2 250)',
      'oklch(0.75 0.19 70)',
      'oklch(0.7 0.16 165)',
    ])
  })

  it('distributes 6 seed cards as todo:2, doing:2, review:1, done:1', () => {
    const board = seedBoard()
    const byId = Object.fromEntries(board.map((c) => [c.id, c.cards.length]))

    expect(byId).toEqual({ todo: 2, doing: 2, review: 1, done: 1 })
  })
})
