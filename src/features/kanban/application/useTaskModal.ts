import { useCallback, useState } from 'react'
import type { Card, ColumnId, TaskDraft } from '../domain/types.ts'

export type TaskModalMode = 'create' | 'edit'

interface TaskModalState {
  isOpen: boolean
  mode: TaskModalMode
  columnId: ColumnId
  draft: TaskDraft
}

function emptyDraft(): TaskDraft {
  return {
    id: null,
    title: '',
    desc: '',
    tagsText: '',
    assigneeName: '',
    due: '',
    priority: 'Media',
  }
}

function draftFromCard(card: Card): TaskDraft {
  return {
    id: card.id,
    title: card.title,
    desc: card.desc,
    tagsText: card.tags.join(', '),
    assigneeName: card.assignee.name,
    due: card.due,
    priority: card.priority,
  }
}

export interface UseTaskModalResult {
  isOpen: boolean
  mode: TaskModalMode
  columnId: ColumnId
  draft: TaskDraft
  openCreate: (columnId: ColumnId) => void
  openEdit: (columnId: ColumnId, card: Card) => void
  close: () => void
  updateDraft: (patch: Partial<TaskDraft>) => void
  setColumnId: (columnId: ColumnId) => void
}

export function useTaskModal(defaultColumnId: ColumnId): UseTaskModalResult {
  const [state, setState] = useState<TaskModalState>({
    isOpen: false,
    mode: 'create',
    columnId: defaultColumnId,
    draft: emptyDraft(),
  })

  const openCreate = useCallback((columnId: ColumnId) => {
    setState({ isOpen: true, mode: 'create', columnId, draft: emptyDraft() })
  }, [])

  const openEdit = useCallback((columnId: ColumnId, card: Card) => {
    setState({ isOpen: true, mode: 'edit', columnId, draft: draftFromCard(card) })
  }, [])

  const close = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }))
  }, [])

  const updateDraft = useCallback((patch: Partial<TaskDraft>) => {
    setState((s) => ({ ...s, draft: { ...s.draft, ...patch } }))
  }, [])

  const setColumnId = useCallback((columnId: ColumnId) => {
    setState((s) => ({ ...s, columnId }))
  }, [])

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    columnId: state.columnId,
    draft: state.draft,
    openCreate,
    openEdit,
    close,
    updateDraft,
    setColumnId,
  }
}
