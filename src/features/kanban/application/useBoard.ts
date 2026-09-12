import { useCallback, useState } from 'react'
import { deleteCard, moveCard, saveCard } from '../domain/board.ts'
import { seedBoard } from '../domain/seed.ts'
import type { Board, ColumnId, DragSource, DropTarget, TaskDraft } from '../domain/types.ts'

export interface UseBoardResult {
  board: Board
  move: (drag: DragSource, target: DropTarget) => void
  save: (draft: TaskDraft, targetColumnId: ColumnId) => void
  remove: (cardId: number) => void
}

export function useBoard(): UseBoardResult {
  const [board, setBoard] = useState<Board>(() => seedBoard())

  const move = useCallback((drag: DragSource, target: DropTarget) => {
    setBoard((current) => moveCard(current, drag, target))
  }, [])

  const save = useCallback((draft: TaskDraft, targetColumnId: ColumnId) => {
    setBoard((current) => saveCard(current, draft, targetColumnId))
  }, [])

  const remove = useCallback((cardId: number) => {
    setBoard((current) => deleteCard(current, cardId))
  }, [])

  return { board, move, save, remove }
}
