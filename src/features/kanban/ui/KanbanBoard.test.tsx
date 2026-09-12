import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { toCssVars } from '../domain/theme/cssVars.ts'
import { darkTheme, lightTheme } from '../domain/theme/tokens.ts'
import { KanbanBoard } from './KanbanBoard.tsx'

const COLUMN_TESTID: Record<string, string> = {
  'Por hacer': 'column-todo',
  'En progreso': 'column-doing',
  Revisión: 'column-review',
  Hecho: 'column-done',
}

function columnFor(name: string): HTMLElement {
  return screen.getByTestId(COLUMN_TESTID[name])
}

describe('KanbanBoard mount', () => {
  it('renders the header, all 4 columns, and 6 seed cards with exact Spanish copy', () => {
    render(<KanbanBoard />)

    expect(screen.getByText('Proyecto Aurora')).toBeInTheDocument()
    expect(screen.getByText('Tablero de gestión de tareas')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar tareas, etiquetas, personas...')).toBeInTheDocument()
    expect(screen.getByTitle('Cambiar tema')).toBeInTheDocument()
    expect(screen.getByText('+ Nueva tarea')).toBeInTheDocument()

    expect(screen.getByText('Por hacer')).toBeInTheDocument()
    expect(screen.getByText('En progreso')).toBeInTheDocument()
    expect(screen.getByText('Revisión')).toBeInTheDocument()
    expect(screen.getByText('Hecho')).toBeInTheDocument()

    expect(screen.getByText('Diseñar sistema de notificaciones')).toBeInTheDocument()
    expect(screen.getByText('Investigar proveedor de pagos')).toBeInTheDocument()
    expect(screen.getByText('Integrar API de autenticación')).toBeInTheDocument()
    expect(screen.getByText('Rediseñar onboarding móvil')).toBeInTheDocument()
    expect(screen.getByText('Corregir bug de sincronización')).toBeInTheDocument()
    expect(screen.getByText('Configurar CI/CD')).toBeInTheDocument()
  })
})

describe('search filtering', () => {
  it('filters cards per column, updates badges to filtered counts, and shows "Sin tareas" when a column empties', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    const search = screen.getByPlaceholderText('Buscar tareas, etiquetas, personas...')
    await user.type(search, 'backend')

    // "Investigar proveedor de pagos" (Luis Peña, tag Backend) stays in "todo"
    expect(screen.getByText('Investigar proveedor de pagos')).toBeInTheDocument()
    expect(screen.queryByText('Diseñar sistema de notificaciones')).not.toBeInTheDocument()

    // "Corregir bug de sincronización" (tags ['Bug','API']) and "Configurar CI/CD"
    // (tag ['DevOps']) don't match "backend" -> both "review" and "done" empty out.
    expect(screen.queryByText('Corregir bug de sincronización')).not.toBeInTheDocument()
    expect(screen.queryByText('Configurar CI/CD')).not.toBeInTheDocument()
    expect(screen.getAllByText('Sin tareas')).toHaveLength(2)

    // Badge shows the filtered count (1), not the column's real total (2).
    const todoColumn = columnFor('Por hacer')
    expect(within(todoColumn).getByTestId('column-badge')).toHaveTextContent('1')
  })
})

describe('theme toggle', () => {
  it('flips ALL --kb-* root vars light to dark and back (all 15 themed surfaces)', async () => {
    const user = userEvent.setup()
    const { container } = render(<KanbanBoard />)

    const root = container.firstElementChild as HTMLElement
    const lightVars = toCssVars(lightTheme)
    const darkVars = toCssVars(darkTheme)

    // Self-sufficient: this test must not pass vacuously on an empty object.
    // Pin the count here rather than relying on cssVars.test.ts elsewhere.
    expect(Object.keys(lightVars)).toHaveLength(15)
    expect(Object.keys(darkVars)).toHaveLength(15)

    for (const [cssVar, value] of Object.entries(lightVars)) {
      expect(root.style.getPropertyValue(cssVar)).toBe(value)
    }

    await user.click(screen.getByTitle('Cambiar tema'))
    for (const [cssVar, value] of Object.entries(darkVars)) {
      expect(root.style.getPropertyValue(cssVar)).toBe(value)
    }

    await user.click(screen.getByTitle('Cambiar tema'))
    for (const [cssVar, value] of Object.entries(lightVars)) {
      expect(root.style.getPropertyValue(cssVar)).toBe(value)
    }
  })
})

describe('header add-task entry point', () => {
  it('opens the create modal preselecting the first column ("todo")', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))

    expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre de la tarea')).toHaveValue('')
    expect(screen.getByLabelText('Columna')).toHaveValue('todo')
  })
})

describe('title validation on edit', () => {
  it('discards a whitespace-only title and keeps the original card intact', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('Diseñar sistema de notificaciones'))
    expect(screen.getByText('Editar tarea')).toBeInTheDocument()

    const title = screen.getByPlaceholderText('Nombre de la tarea')
    expect(title).toHaveValue('Diseñar sistema de notificaciones')

    await user.clear(title)
    await user.type(title, '   ')
    await user.click(screen.getByText('Guardar'))

    // Modal closes, but the blank-title guard leaves the board untouched.
    expect(screen.queryByText('Editar tarea')).not.toBeInTheDocument()
    expect(screen.getByText('Diseñar sistema de notificaciones')).toBeInTheDocument()

    const todoColumn = columnFor('Por hacer')
    expect(within(todoColumn).getByTestId('column-badge')).toHaveTextContent('2')
  })
})
