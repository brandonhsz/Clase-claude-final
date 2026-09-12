export type ColumnId = 'todo' | 'doing' | 'review' | 'done'

export type Priority = 'Alta' | 'Media' | 'Baja'

export type ThemeMode = 'light' | 'dark'

export interface Assignee {
  name: string
}

export interface Card {
  id: number
  title: string
  desc: string
  tags: string[]
  assignee: Assignee
  due: string
  priority: Priority
}

export interface Column {
  id: ColumnId
  name: string
  accent: string
  cards: Card[]
}

export type Board = readonly Column[]

export interface DragSource {
  cardId: number
  fromColumnId: ColumnId
}

export type DropTarget =
  | { kind: 'before-card'; columnId: ColumnId; cardId: number }
  | { kind: 'end-of-column'; columnId: ColumnId }

export interface TaskDraft {
  id: number | null
  title: string
  desc: string
  tagsText: string
  assigneeName: string
  due: string
  priority: Priority
}

// Token values are plain `string`: the palette mixes oklch() and #fff.
// Do NOT narrow this to an `oklch(${string})` template literal type.
export type ThemeTokenName =
  | 'pageBg'
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'panelBg'
  | 'cardBg'
  | 'cardBorder'
  | 'cardHoverBorder'
  | 'inputBg'
  | 'inputBorder'
  | 'badgeBg'
  | 'modalBg'
  | 'overlayBg'
  | 'addHover'
  | 'cancelBg'

export type Theme = Record<ThemeTokenName, string>

const COLUMN_IDS: readonly ColumnId[] = ['todo', 'doing', 'review', 'done']

export function isColumnId(value: string): value is ColumnId {
  return (COLUMN_IDS as readonly string[]).includes(value)
}
