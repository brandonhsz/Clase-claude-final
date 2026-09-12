import type { TagChip as TagChipData } from '../domain/presentation.ts'
import styles from './TagChip.module.css'

interface TagChipProps {
  chip: TagChipData
}

export function TagChip({ chip }: TagChipProps) {
  return (
    <span className={styles.chip} style={{ background: chip.bg, color: chip.fg }}>
      {chip.label}
    </span>
  )
}
