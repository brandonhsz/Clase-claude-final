import type { ChangeEvent, MouseEvent } from 'react'
import { useState } from 'react'
import { isValidDueDate } from '../domain/validation.ts'
import { isColumnId } from '../domain/types.ts'
import type { ColumnId, Priority, TaskDraft } from '../domain/types.ts'
import styles from './TaskModal.module.css'

interface ColumnOption {
  id: ColumnId
  name: string
}

interface TaskModalProps {
  mode: 'create' | 'edit'
  columnId: ColumnId
  draft: TaskDraft
  columnOptions: ColumnOption[]
  onFieldChange: (patch: Partial<TaskDraft>) => void
  onColumnChange: (columnId: ColumnId) => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

export function TaskModal({
  mode,
  columnId,
  draft,
  columnOptions,
  onFieldChange,
  onColumnChange,
  onSave,
  onCancel,
  onDelete,
}: TaskModalProps) {
  const heading = mode === 'edit' ? 'Editar tarea' : 'Nueva tarea'
  const [dueError, setDueError] = useState(false)

  function stopPropagation(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
  }

  function handleSave() {
    // Title validation is a DISCARD, not a validation error: a blank/whitespace
    // title always proceeds to onSave() (where saveCard no-ops) and closes the
    // modal, regardless of due-date validity. Only a non-blank title attempt is
    // gated on the due date.
    if (!draft.title.trim()) {
      setDueError(false)
      onSave()
      return
    }
    if (!isValidDueDate(draft.due)) {
      setDueError(true)
      return
    }
    setDueError(false)
    onSave()
  }

  function handleDueChange(event: ChangeEvent<HTMLInputElement>) {
    if (dueError) setDueError(false)
    onFieldChange({ due: event.target.value })
  }

  function handleColumnChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    // The <option> values are always real column ids, so this guard never
    // actually rejects anything in practice — but it replaces an unchecked
    // `as ColumnId` cast with a real runtime check at the one boundary where
    // a raw string enters the domain's ColumnId type.
    if (isColumnId(value)) onColumnChange(value)
  }

  return (
    <div className={styles.overlay} onClick={onCancel} data-testid="modal-overlay">
      <div className={styles.modal} onClick={stopPropagation}>
        <div className={styles.heading}>{heading}</div>

        <div className={styles.field}>
          <label htmlFor="task-title" className={styles.label}>
            Título
          </label>
          <input
            id="task-title"
            type="text"
            value={draft.title}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onFieldChange({ title: event.target.value })}
            placeholder="Nombre de la tarea"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="task-desc" className={styles.label}>
            Descripción
          </label>
          <textarea
            id="task-desc"
            value={draft.desc}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onFieldChange({ desc: event.target.value })}
            placeholder="Detalles de la tarea"
            rows={3}
            className={styles.textarea}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.fieldFlex}>
            <label htmlFor="task-column" className={styles.label}>
              Columna
            </label>
            <select id="task-column" value={columnId} onChange={handleColumnChange} className={styles.select}>
              {columnOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.fieldFlex}>
            <label htmlFor="task-priority" className={styles.label}>
              Prioridad
            </label>
            <select
              id="task-priority"
              value={draft.priority}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                onFieldChange({ priority: event.target.value as Priority })
              }
              className={styles.select}
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.fieldFlex}>
            <label htmlFor="task-assignee" className={styles.label}>
              Responsable
            </label>
            <input
              id="task-assignee"
              type="text"
              value={draft.assigneeName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                onFieldChange({ assigneeName: event.target.value })
              }
              placeholder="Nombre"
              className={styles.input}
            />
          </div>
          <div className={styles.fieldFlex}>
            <label htmlFor="task-due" className={styles.label}>
              Fecha límite
            </label>
            <input
              id="task-due"
              type="text"
              value={draft.due}
              onChange={handleDueChange}
              placeholder="Ej: 20 sep"
              className={styles.input}
            />
            {dueError && <div className={styles.error}>Fecha límite inválida</div>}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="task-tags" className={styles.label}>
            Etiquetas (separadas por coma)
          </label>
          <input
            id="task-tags"
            type="text"
            value={draft.tagsText}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onFieldChange({ tagsText: event.target.value })}
            placeholder="Frontend, Bug, API"
            className={styles.input}
          />
        </div>

        <div className={styles.footer}>
          {mode === 'edit' && (
            <button type="button" onClick={onDelete} className={styles.deleteButton}>
              Eliminar
            </button>
          )}
          <div className={styles.footerRight}>
            <button type="button" onClick={onCancel} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="button" onClick={handleSave} className={styles.saveButton}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
