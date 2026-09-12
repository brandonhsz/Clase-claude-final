import type { CSSProperties } from 'react'
import { useMemo, useRef, useState } from 'react'
import { useBoard } from '../application/useBoard.ts'
import { useTaskModal } from '../application/useTaskModal.ts'
import { filterBoard } from '../domain/search.ts'
import { toCssVars } from '../domain/theme/cssVars.ts'
import { darkTheme, lightTheme } from '../domain/theme/tokens.ts'
import type { Card, ColumnId, DragSource, ThemeMode } from '../domain/types.ts'
import { BoardHeader } from './BoardHeader.tsx'
import { ColumnPanel } from './ColumnPanel.tsx'
import { TaskModal } from './TaskModal.tsx'
import styles from './KanbanBoard.module.css'

export function KanbanBoard() {
  const { board, move, save, remove } = useBoard()
  const [search, setSearch] = useState('')
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const modal = useTaskModal('todo')
  const dragRef = useRef<DragSource | null>(null)

  const theme = themeMode === 'dark' ? darkTheme : lightTheme
  const cssVars = useMemo(() => toCssVars(theme), [theme])
  const filteredBoard = useMemo(() => filterBoard(board, search), [board, search])
  const columnOptions = useMemo(() => board.map((c) => ({ id: c.id, name: c.name })), [board])

  function handleCardDragStart(cardId: number, columnId: ColumnId) {
    dragRef.current = { cardId, fromColumnId: columnId }
  }

  function handleCardDrop(columnId: ColumnId, cardId: number) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    move(drag, { kind: 'before-card', columnId, cardId })
  }

  function handleColumnDrop(columnId: ColumnId) {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag) return
    move(drag, { kind: 'end-of-column', columnId })
  }

  function handleCardClick(columnId: ColumnId, card: Card) {
    modal.openEdit(columnId, card)
  }

  function handleAddClick(columnId: ColumnId) {
    modal.openCreate(columnId)
  }

  function handleNewTask() {
    modal.openCreate(board[0].id)
  }

  function handleSave() {
    save(modal.draft, modal.columnId)
    modal.close()
  }

  function handleDelete() {
    if (modal.draft.id != null) remove(modal.draft.id)
    modal.close()
  }

  return (
    <div className={styles.page} style={cssVars as CSSProperties}>
      <BoardHeader
        search={search}
        onSearchChange={setSearch}
        onToggleTheme={() => setThemeMode((m) => (m === 'light' ? 'dark' : 'light'))}
        onNewTask={handleNewTask}
      />

      <div className={styles.row}>
        {filteredBoard.map((column) => (
          <ColumnPanel
            key={column.id}
            column={column}
            themeMode={themeMode}
            onAddClick={handleAddClick}
            onCardClick={handleCardClick}
            onCardDragStart={handleCardDragStart}
            onCardDrop={handleCardDrop}
            onColumnDrop={handleColumnDrop}
          />
        ))}
      </div>

      {modal.isOpen && (
        <TaskModal
          mode={modal.mode}
          columnId={modal.columnId}
          draft={modal.draft}
          columnOptions={columnOptions}
          onFieldChange={modal.updateDraft}
          onColumnChange={modal.setColumnId}
          onSave={handleSave}
          onCancel={modal.close}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
