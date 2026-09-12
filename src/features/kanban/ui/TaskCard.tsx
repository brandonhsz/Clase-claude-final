import type { DragEvent } from 'react'
import { tagChip } from '../domain/presentation.ts'
import type { Card, ThemeMode } from '../domain/types.ts'
import { Avatar } from './Avatar.tsx'
import { PriorityBadge } from './PriorityBadge.tsx'
import { TagChip } from './TagChip.tsx'
import styles from './TaskCard.module.css'

interface TaskCardProps {
  card: Card
  themeMode: ThemeMode
  onDragStart: (event: DragEvent<HTMLDivElement>) => void
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onClick: () => void
}

export function TaskCard({ card, themeMode, onDragStart, onDragOver, onDrop, onClick }: TaskCardProps) {
  return (
    <div
      className={styles.card}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      data-testid={`card-${card.id}`}
    >
      <div className={styles.tags}>
        {card.tags.map((tag) => (
          <TagChip key={tag} chip={tagChip(tag, themeMode)} />
        ))}
      </div>
      <div className={styles.title}>{card.title}</div>
      <div className={styles.footer}>
        <div className={styles.assignee}>
          <Avatar name={card.assignee.name} />
          <span className={styles.due}>{card.due}</span>
        </div>
        <PriorityBadge priority={card.priority} />
      </div>
    </div>
  )
}
