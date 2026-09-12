import type { DragEvent } from 'react'
import type { Card, Column, ColumnId, ThemeMode } from '../domain/types.ts'
import { TaskCard } from './TaskCard.tsx'
import styles from './ColumnPanel.module.css'

interface ColumnPanelProps {
  column: Column
  themeMode: ThemeMode
  onAddClick: (columnId: ColumnId) => void
  onCardClick: (columnId: ColumnId, card: Card) => void
  onCardDragStart: (cardId: number, columnId: ColumnId) => void
  onCardDrop: (columnId: ColumnId, cardId: number) => void
  onColumnDrop: (columnId: ColumnId) => void
}

export function ColumnPanel({
  column,
  themeMode,
  onAddClick,
  onCardClick,
  onCardDragStart,
  onCardDrop,
  onColumnDrop,
}: ColumnPanelProps) {
  return (
    <div
      className={styles.column}
      onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        onColumnDrop(column.id)
      }}
      data-testid={`column-${column.id}`}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.accentDot} style={{ background: column.accent }} />
          <span className={styles.name}>{column.name}</span>
        </div>
        <span className={styles.badge} data-testid="column-badge">
          {column.cards.length}
        </span>
      </div>

      <div className={styles.cards}>
        {column.cards.map((card) => (
          <TaskCard
            key={card.id}
            card={card}
            themeMode={themeMode}
            onDragStart={() => onCardDragStart(card.id, column.id)}
            onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
            onDrop={(event: DragEvent<HTMLDivElement>) => {
              event.preventDefault()
              event.stopPropagation()
              onCardDrop(column.id, card.id)
            }}
            onClick={() => onCardClick(column.id, card)}
          />
        ))}
        {column.cards.length === 0 && <div className={styles.empty}>Sin tareas</div>}
      </div>

      <button type="button" className={styles.addButton} onClick={() => onAddClick(column.id)}>
        + Añadir tarea
      </button>
    </div>
  )
}
