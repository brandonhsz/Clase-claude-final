import type { ChangeEvent } from 'react'
import styles from './BoardHeader.module.css'

interface BoardHeaderProps {
  search: string
  onSearchChange: (value: string) => void
  onToggleTheme: () => void
  onNewTask: () => void
}

export function BoardHeader({ search, onSearchChange, onToggleTheme, onNewTask }: BoardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <div className={styles.logoDot} />
        </div>
        <div>
          <div className={styles.title}>Proyecto Aurora</div>
          <div className={styles.subtitle}>Tablero de gestión de tareas</div>
        </div>
      </div>
      <div className={styles.actions}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Buscar tareas, etiquetas, personas..."
            value={search}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.searchIcon} />
        </div>
        <button type="button" onClick={onToggleTheme} title="Cambiar tema" className={styles.themeToggle}>
          <div className={styles.themeDot} />
        </button>
        <button type="button" onClick={onNewTask} className={styles.newTaskButton}>
          + Nueva tarea
        </button>
      </div>
    </div>
  )
}
