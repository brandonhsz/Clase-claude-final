import { describe, expect, it } from 'vitest'
import {
  deleteCard,
  moveCard,
  nextCardId,
  resolveInsertIndex,
  saveCard,
} from './board.ts'
import type { Board, Card, TaskDraft } from './types.ts'

function card(id: number, title = `card-${id}`): Card {
  return {
    id,
    title,
    desc: '',
    tags: [],
    assignee: { name: 'Sin asignar' },
    due: 'Sin fecha',
    priority: 'Media',
  }
}

function boardWith(todo: Card[], doing: Card[] = [], review: Card[] = [], done: Card[] = []): Board {
  return [
    { id: 'todo', name: 'Por hacer', accent: 'oklch(0.62 0.23 300)', cards: todo },
    { id: 'doing', name: 'En progreso', accent: 'oklch(0.62 0.2 250)', cards: doing },
    { id: 'review', name: 'Revisión', accent: 'oklch(0.75 0.19 70)', cards: review },
    { id: 'done', name: 'Hecho', accent: 'oklch(0.7 0.16 165)', cards: done },
  ]
}

function draft(overrides: Partial<TaskDraft>): TaskDraft {
  return {
    id: null,
    title: 'New task',
    desc: '',
    tagsText: '',
    assigneeName: '',
    due: '',
    priority: 'Media',
    ...overrides,
  }
}

describe('saveCard', () => {
  it('create appends to the target column', () => {
    const board = boardWith([card(1)])
    const result = saveCard(board, draft({ title: 'New' }), 'todo')
    const todo = result.find((c) => c.id === 'todo')!
    expect(todo.cards.map((c) => c.title)).toEqual(['card-1', 'New'])
  })

  it('edit with unchanged column replaces in place, preserving index', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B'), card(3, 'C')])
    const result = saveCard(board, draft({ id: 2, title: 'B-edited' }), 'todo')
    const todo = result.find((c) => c.id === 'todo')!
    expect(todo.cards.map((c) => c.title)).toEqual(['A', 'B-edited', 'C'])
  })

  it('edit with changed column removes from origin and appends to new column end', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B')], [card(3, 'X')])
    const result = saveCard(board, draft({ id: 2, title: 'B' }), 'doing')
    const todo = result.find((c) => c.id === 'todo')!
    const doing = result.find((c) => c.id === 'doing')!
    expect(todo.cards.map((c) => c.title)).toEqual(['A'])
    expect(doing.cards.map((c) => c.title)).toEqual(['X', 'B'])
  })

  it('blank title discards without mutating the board', () => {
    const board = boardWith([card(1, 'A')])
    const result = saveCard(board, draft({ title: '   ' }), 'todo')
    expect(result.find((c) => c.id === 'todo')!.cards).toHaveLength(1)
  })

  it('blank assignee defaults to "Sin asignar" and blank due to "Sin fecha"', () => {
    const board = boardWith([])
    const result = saveCard(board, draft({ title: 'X', assigneeName: '  ', due: '' }), 'todo')
    const created = result.find((c) => c.id === 'todo')!.cards[0]
    expect(created.assignee.name).toBe('Sin asignar')
    expect(created.due).toBe('Sin fecha')
  })

  it('parses tags by trimming and discarding empty entries', () => {
    const board = boardWith([])
    const result = saveCard(board, draft({ title: 'X', tagsText: ' Frontend ,, Bug ' }), 'todo')
    const created = result.find((c) => c.id === 'todo')!.cards[0]
    expect(created.tags).toEqual(['Frontend', 'Bug'])
  })

  it('de-duplicates repeated tags, preserving first-occurrence order', () => {
    const board = boardWith([])
    const result = saveCard(board, draft({ title: 'X', tagsText: 'Bug, Bug, Frontend, bug' }), 'todo')
    const created = result.find((c) => c.id === 'todo')!.cards[0]
    // Exact-string de-duplication only ("Bug" vs "bug" are distinct tags);
    // case normalization is not requested and would lose user intent.
    expect(created.tags).toEqual(['Bug', 'Frontend', 'bug'])
  })
})

describe('deleteCard', () => {
  it('removes the card from its column without mutating the input', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B')])
    const snapshot = JSON.stringify(board)
    const result = deleteCard(board, 1)
    expect(result.find((c) => c.id === 'todo')!.cards.map((c) => c.id)).toEqual([2])
    expect(JSON.stringify(board)).toBe(snapshot)
  })
})

describe('moveCard', () => {
  it('same-column: dragging downward lands before the target', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B'), card(3, 'C'), card(4, 'D')])
    const result = moveCard(board, { cardId: 1, fromColumnId: 'todo' }, {
      kind: 'before-card',
      columnId: 'todo',
      cardId: 3,
    })
    expect(result.find((c) => c.id === 'todo')!.cards.map((c) => c.title)).toEqual([
      'B',
      'A',
      'C',
      'D',
    ])
  })

  it('same-column: dragging upward lands before the target', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B'), card(3, 'C'), card(4, 'D')])
    const result = moveCard(board, { cardId: 4, fromColumnId: 'todo' }, {
      kind: 'before-card',
      columnId: 'todo',
      cardId: 2,
    })
    expect(result.find((c) => c.id === 'todo')!.cards.map((c) => c.title)).toEqual([
      'A',
      'D',
      'B',
      'C',
    ])
  })

  it('drop-on-self is a no-op', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B'), card(3, 'C')])
    const result = moveCard(board, { cardId: 1, fromColumnId: 'todo' }, {
      kind: 'before-card',
      columnId: 'todo',
      cardId: 1,
    })
    expect(result.find((c) => c.id === 'todo')!.cards.map((c) => c.title)).toEqual([
      'A',
      'B',
      'C',
    ])
  })

  it('cross-column: inserts before target real (post-removal) index', () => {
    const board = boardWith([card(1, 'A')], [card(2, 'X'), card(3, 'Y')])
    const result = moveCard(board, { cardId: 1, fromColumnId: 'todo' }, {
      kind: 'before-card',
      columnId: 'doing',
      cardId: 3,
    })
    expect(result.find((c) => c.id === 'todo')!.cards).toHaveLength(0)
    expect(result.find((c) => c.id === 'doing')!.cards.map((c) => c.title)).toEqual([
      'X',
      'A',
      'Y',
    ])
  })

  it('end-of-column appends the card', () => {
    const board = boardWith([card(1, 'A')], [card(2, 'X'), card(3, 'Y')])
    const result = moveCard(board, { cardId: 1, fromColumnId: 'todo' }, {
      kind: 'end-of-column',
      columnId: 'doing',
    })
    expect(result.find((c) => c.id === 'doing')!.cards.map((c) => c.title)).toEqual([
      'X',
      'Y',
      'A',
    ])
  })

  it('unknown cardId leaves the board unchanged', () => {
    const board = boardWith([card(1, 'A')])
    const result = moveCard(board, { cardId: 999, fromColumnId: 'todo' }, {
      kind: 'end-of-column',
      columnId: 'doing',
    })
    expect(result.find((c) => c.id === 'todo')!.cards.map((c) => c.id)).toEqual([1])
    expect(result.find((c) => c.id === 'doing')!.cards).toHaveLength(0)
  })

  it('unknown columnId leaves the board unchanged', () => {
    const board = boardWith([card(1, 'A')])
    const result = moveCard(board, { cardId: 1, fromColumnId: 'todo' }, {
      kind: 'end-of-column',
      // @ts-expect-error -- intentionally invalid columnId for the test
      columnId: 'nope',
    })
    expect(result.find((c) => c.id === 'todo')!.cards.map((c) => c.id)).toEqual([1])
  })

  it('preserves total card count and does not mutate the input board', () => {
    const board = boardWith([card(1, 'A'), card(2, 'B')], [card(3, 'X')])
    const snapshot = JSON.stringify(board)
    const totalBefore = board.reduce((n, c) => n + c.cards.length, 0)
    const result = moveCard(board, { cardId: 1, fromColumnId: 'todo' }, {
      kind: 'before-card',
      columnId: 'doing',
      cardId: 3,
    })
    const totalAfter = result.reduce((n, c) => n + c.cards.length, 0)
    expect(totalAfter).toBe(totalBefore)
    expect(JSON.stringify(board)).toBe(snapshot)
  })
})

describe('nextCardId', () => {
  it('is max(all ids) + 1', () => {
    const board = boardWith([card(1), card(5)], [card(3)])
    expect(nextCardId(board)).toBe(6)
  })

  it('is 1 for an empty board', () => {
    const board = boardWith([], [], [], [])
    expect(nextCardId(board)).toBe(1)
  })
})

describe('resolveInsertIndex', () => {
  it('clamps a negative index to 0', () => {
    expect(resolveInsertIndex([card(1), card(2)], -5)).toBe(0)
  })

  it('clamps an index beyond the array length to the array length', () => {
    expect(resolveInsertIndex([card(1), card(2)], 99)).toBe(2)
  })

  it('passes an in-range index through unchanged', () => {
    expect(resolveInsertIndex([card(1), card(2), card(3)], 1)).toBe(1)
  })
})
