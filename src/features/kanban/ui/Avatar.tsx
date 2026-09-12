import { avatarColor, initials } from '../domain/presentation.ts'
import styles from './Avatar.module.css'

interface AvatarProps {
  name: string
}

export function Avatar({ name }: AvatarProps) {
  return (
    <div className={styles.avatar} style={{ background: avatarColor(name) }}>
      {initials(name)}
    </div>
  )
}
