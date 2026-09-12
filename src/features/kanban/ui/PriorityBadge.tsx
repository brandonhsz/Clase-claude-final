import { priorityMeta } from '../domain/presentation.ts'
import type { Priority } from '../domain/types.ts'
import styles from './PriorityBadge.module.css'

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const meta = priorityMeta(priority)
  return (
    <span className={styles.badge} style={{ background: meta.bg, color: meta.fg }}>
      {priority}
    </span>
  )
}
