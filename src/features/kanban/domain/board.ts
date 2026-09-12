import type { Board, Card, ColumnId, DragSource, DropTarget, TaskDraft } from './types.ts'

function clamp(i: number, min: number, max: number): number {
  return Math.max(min, Math.min(i, max))
}

/**
 * Clamps an insertion index into the bounds of `cards`. After the id-based
 * redesign of `moveCard`, this is a defensive invariant assertion, not
 * load-bearing arithmetic — every caller already computes an in-range index.
 */
export function resolveInsertIndex(cards: readonly Card[], index: number): number {
  return clamp(index, 0, cards.length)
}

export function nextCardId(board: Board): number {
  let max = 0
  for (const column of board) {
    for (const card of column.cards) {
      if (card.id > max) max = card.id
    }
  }
  return max + 1
}

export function saveCard(board: Board, draft: TaskDraft, targetColumnId: ColumnId): Board {
  const title = draft.title.trim()
  if (!title) return board

  // De-duplicate (exact-string, order-preserving) so repeated tags never
  // produce duplicate React keys in TaskCard's tag chip list.
  const tags = [...new Set(draft.tagsText.split(',').map((t) => t.trim()).filter(Boolean))]
  const assigneeName = draft.assigneeName.trim() || 'Sin asignar'
  const due = draft.due.trim() || 'Sin fecha'

  const id = draft.id ?? nextCardId(board)
  const built: Card = {
    id,
    title,
    desc: draft.desc,
    tags,
    assignee: { name: assigneeName },
    due,
    priority: draft.priority,
  }

  const originColumn = board.find((c) => c.cards.some((card) => card.id === id))

  if (originColumn && originColumn.id === targetColumnId) {
    // Edit, column unchanged: replace in place, preserving index.
    return board.map((column) =>
      column.id === targetColumnId
        ? { ...column, cards: column.cards.map((card) => (card.id === id ? built : card)) }
        : column,
    )
  }

  // Create, or edit with a column change: remove from origin (if any), append to target end.
  return board.map((column) => {
    if (column.id === targetColumnId) {
      return { ...column, cards: [...column.cards, built] }
    }
    if (originColumn && column.id === originColumn.id) {
      return { ...column, cards: column.cards.filter((card) => card.id !== id) }
    }
    return column
  })
}

export function deleteCard(board: Board, cardId: number): Board {
  return board.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => card.id !== cardId),
  }))
}

export function moveCard(board: Board, drag: DragSource, target: DropTarget): Board {
  const fromColumn = board.find((c) => c.id === drag.fromColumnId)
  if (!fromColumn) return board

  const dragIndex = fromColumn.cards.findIndex((c) => c.id === drag.cardId)
  if (dragIndex === -1) return board

  const toColumn = board.find((c) => c.id === target.columnId)
  if (!toColumn) return board

  if (target.kind === 'before-card' && target.cardId === drag.cardId) {
    // Drop on self: explicit no-op.
    return board
  }

  const movedCard = fromColumn.cards[dragIndex]

  // Remove first, then resolve the target index by id in the post-removal array.
  const columns = board.map((column) => {
    if (column.id === fromColumn.id) {
      return { ...column, cards: column.cards.filter((c) => c.id !== drag.cardId) }
    }
    return column
  })

  const destColumn = columns.find((c) => c.id === target.columnId)!
  let insertAt: number
  if (target.kind === 'end-of-column') {
    insertAt = destColumn.cards.length
  } else {
    const targetIndex = destColumn.cards.findIndex((c) => c.id === target.cardId)
    if (targetIndex === -1) return board
    insertAt = targetIndex
  }
  insertAt = resolveInsertIndex(destColumn.cards, insertAt)

  return columns.map((column) => {
    if (column.id !== destColumn.id) return column
    const cards = [...column.cards]
    cards.splice(insertAt, 0, movedCard)
    return { ...column, cards }
  })
}
