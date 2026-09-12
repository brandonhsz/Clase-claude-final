import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Card } from '../domain/types.ts'
import { useTaskModal } from './useTaskModal.ts'

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 5,
    title: 'Corregir bug',
    desc: 'Detalle',
    tags: ['Backend', 'API'],
    assignee: { name: 'Ana Ortiz' },
    due: '13 sep',
    priority: 'Alta',
    ...overrides,
  }
}

describe('useTaskModal', () => {
  it('starts closed, in create mode, with the given default column and an empty draft', () => {
    const { result } = renderHook(() => useTaskModal('todo'))

    expect(result.current.isOpen).toBe(false)
    expect(result.current.mode).toBe('create')
    expect(result.current.columnId).toBe('todo')
    expect(result.current.draft).toEqual({
      id: null,
      title: '',
      desc: '',
      tagsText: '',
      assigneeName: '',
      due: '',
      priority: 'Media',
    })
  })

  it('openCreate() opens in create mode with an empty draft preselecting the given column', () => {
    const { result } = renderHook(() => useTaskModal('todo'))

    act(() => {
      result.current.openCreate('doing')
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.mode).toBe('create')
    expect(result.current.columnId).toBe('doing')
    expect(result.current.draft.title).toBe('')
    expect(result.current.draft.id).toBeNull()
  })

  it('openEdit() opens in edit mode pre-filled from the card, joining tags with ", "', () => {
    const { result } = renderHook(() => useTaskModal('todo'))

    act(() => {
      result.current.openEdit('review', card())
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.mode).toBe('edit')
    expect(result.current.columnId).toBe('review')
    expect(result.current.draft).toEqual({
      id: 5,
      title: 'Corregir bug',
      desc: 'Detalle',
      tagsText: 'Backend, API',
      assigneeName: 'Ana Ortiz',
      due: '13 sep',
      priority: 'Alta',
    })
  })

  it('close() closes the modal without resetting mode, columnId, or draft', () => {
    const { result } = renderHook(() => useTaskModal('todo'))

    act(() => {
      result.current.openEdit('review', card())
    })
    act(() => {
      result.current.close()
    })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.mode).toBe('edit')
    expect(result.current.draft.title).toBe('Corregir bug')
  })

  it('updateDraft() merges a partial patch into the current draft', () => {
    const { result } = renderHook(() => useTaskModal('todo'))

    act(() => {
      result.current.openCreate('todo')
    })
    act(() => {
      result.current.updateDraft({ title: 'Título nuevo' })
    })
    act(() => {
      result.current.updateDraft({ assigneeName: 'Luis Peña' })
    })

    expect(result.current.draft.title).toBe('Título nuevo')
    expect(result.current.draft.assigneeName).toBe('Luis Peña')
    // Untouched fields are preserved.
    expect(result.current.draft.priority).toBe('Media')
  })

  it('setColumnId() changes only the selected column, leaving the draft untouched', () => {
    const { result } = renderHook(() => useTaskModal('todo'))

    act(() => {
      result.current.openEdit('todo', card())
    })
    act(() => {
      result.current.setColumnId('done')
    })

    expect(result.current.columnId).toBe('done')
    expect(result.current.draft.title).toBe('Corregir bug')
  })
})
