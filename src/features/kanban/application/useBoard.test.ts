import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { seedBoard } from '../domain/seed.ts'
import { useBoard } from './useBoard.ts'

describe('useBoard', () => {
  it('initializes with the seed board', () => {
    const { result } = renderHook(() => useBoard())
    expect(result.current.board).toEqual(seedBoard())
  })

  it('move() updates the board via the domain moveCard function', () => {
    const { result } = renderHook(() => useBoard())

    act(() => {
      result.current.move(
        { cardId: 1, fromColumnId: 'todo' },
        { kind: 'end-of-column', columnId: 'done' },
      )
    })

    const todo = result.current.board.find((c) => c.id === 'todo')!
    const done = result.current.board.find((c) => c.id === 'done')!
    expect(todo.cards.some((c) => c.id === 1)).toBe(false)
    expect(done.cards.at(-1)?.id).toBe(1)
  })

  it('save() creates a card via the domain saveCard function', () => {
    const { result } = renderHook(() => useBoard())

    act(() => {
      result.current.save(
        {
          id: null,
          title: 'Nueva tarea de prueba',
          desc: '',
          tagsText: '',
          assigneeName: '',
          due: '',
          priority: 'Media',
        },
        'todo',
      )
    })

    const todo = result.current.board.find((c) => c.id === 'todo')!
    expect(todo.cards.some((c) => c.title === 'Nueva tarea de prueba')).toBe(true)
  })

  it('save() preserves card position when editing without a column change', () => {
    const { result } = renderHook(() => useBoard())
    // Seed "todo" = [1: Diseñar..., 2: Investigar...]. Edit card 1 in place.
    const originalOrder = result.current.board.find((c) => c.id === 'todo')!.cards.map((c) => c.id)

    act(() => {
      result.current.save(
        {
          id: 1,
          title: 'Diseñar (editado)',
          desc: '',
          tagsText: '',
          assigneeName: '',
          due: '',
          priority: 'Media',
        },
        'todo',
      )
    })

    const todo = result.current.board.find((c) => c.id === 'todo')!
    expect(todo.cards.map((c) => c.id)).toEqual(originalOrder)
    expect(todo.cards[0].title).toBe('Diseñar (editado)')
  })

  it('save() with a blank title does not add or change any card', () => {
    const { result } = renderHook(() => useBoard())
    const before = result.current.board

    act(() => {
      result.current.save(
        {
          id: null,
          title: '   ',
          desc: '',
          tagsText: '',
          assigneeName: '',
          due: '',
          priority: 'Media',
        },
        'todo',
      )
    })

    expect(result.current.board).toEqual(before)
  })

  it('remove() updates the board via the domain deleteCard function', () => {
    const { result } = renderHook(() => useBoard())

    act(() => {
      result.current.remove(1)
    })

    const todo = result.current.board.find((c) => c.id === 'todo')!
    expect(todo.cards.some((c) => c.id === 1)).toBe(false)
  })
})
