import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { KanbanBoard } from './KanbanBoard.tsx'

const COLUMN_TESTID: Record<string, string> = {
  'Por hacer': 'column-todo',
  'En progreso': 'column-doing',
  Revisión: 'column-review',
  Hecho: 'column-done',
}

// Known seed card ids (see domain/seed.ts) — used to locate cards without any
// class-name or DOM-position coupling.
const CARD_TESTID = {
  'Diseñar sistema de notificaciones': 'card-1',
  'Investigar proveedor de pagos': 'card-2',
  'Integrar API de autenticación': 'card-3',
  'Rediseñar onboarding móvil': 'card-4',
  'Corregir bug de sincronización': 'card-5',
  'Configurar CI/CD': 'card-6',
} as const

function columnFor(name: string): HTMLElement {
  return screen.getByTestId(COLUMN_TESTID[name])
}

function seedCard(title: keyof typeof CARD_TESTID): HTMLElement {
  return screen.getByTestId(CARD_TESTID[title])
}

// For cards created during a test (dynamic id), locate by title text (an
// accessible query) then walk up to the nearest data-testid boundary.
function cardByTitle(title: string): HTMLElement {
  return screen.getByText(title).closest('[data-testid^="card-"]') as HTMLElement
}

function dragAndDrop(source: HTMLElement, target: HTMLElement) {
  fireEvent.dragStart(source)
  fireEvent.dragOver(target)
  fireEvent.drop(target)
}

describe('cross-column move', () => {
  it('moves a card from its source column into the target column', () => {
    render(<KanbanBoard />)

    dragAndDrop(seedCard('Diseñar sistema de notificaciones'), seedCard('Configurar CI/CD'))

    const todoColumn = columnFor('Por hacer')
    const doneColumn = columnFor('Hecho')
    expect(within(todoColumn).queryByText('Diseñar sistema de notificaciones')).not.toBeInTheDocument()
    expect(within(doneColumn).getByText('Diseñar sistema de notificaciones')).toBeInTheDocument()
  })
})

describe('same-column reorder', () => {
  it('drags downward: card lands immediately before the target', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    // The seed only gives "todo" 2 cards; add a 3rd so a real (non-adjacent-only)
    // downward reorder is observable: real todo = [Diseñar..., Investigar..., Extra].
    await user.click(within(columnFor('Por hacer')).getByText('+ Añadir tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Extra')
    await user.click(screen.getByText('Guardar'))

    dragAndDrop(seedCard('Diseñar sistema de notificaciones'), cardByTitle('Extra'))

    const todoColumn = columnFor('Por hacer')
    const titles = within(todoColumn)
      .getAllByText(/Diseñar sistema de notificaciones|Investigar proveedor de pagos|Extra/)
      .map((el) => el.textContent)
    expect(titles).toEqual(['Investigar proveedor de pagos', 'Diseñar sistema de notificaciones', 'Extra'])
  })

  it('drags upward: card lands immediately before the target', () => {
    render(<KanbanBoard />)

    // "doing" = [Integrar API de autenticación, Rediseñar onboarding móvil]
    dragAndDrop(seedCard('Rediseñar onboarding móvil'), seedCard('Integrar API de autenticación'))

    const doingColumn = columnFor('En progreso')
    const titles = within(doingColumn)
      .getAllByText(/Integrar API de autenticación|Rediseñar onboarding móvil/)
      .map((el) => el.textContent)
    expect(titles).toEqual(['Rediseñar onboarding móvil', 'Integrar API de autenticación'])
  })
})

describe('drop on self', () => {
  it('is a no-op', () => {
    render(<KanbanBoard />)

    const card = seedCard('Diseñar sistema de notificaciones')
    dragAndDrop(card, card)

    const todoColumn = columnFor('Por hacer')
    const titles = within(todoColumn)
      .getAllByText(/Diseñar sistema de notificaciones|Investigar proveedor de pagos/)
      .map((el) => el.textContent)
    expect(titles).toEqual(['Diseñar sistema de notificaciones', 'Investigar proveedor de pagos'])
  })
})

describe('drop on column background', () => {
  it('appends the card to the end of that column', () => {
    render(<KanbanBoard />)

    const doneColumn = columnFor('Hecho')
    dragAndDrop(seedCard('Diseñar sistema de notificaciones'), doneColumn)

    const titles = within(doneColumn)
      .getAllByText(/Configurar CI\/CD|Diseñar sistema de notificaciones/)
      .map((el) => el.textContent)
    expect(titles).toEqual(['Configurar CI/CD', 'Diseñar sistema de notificaciones'])
  })
})

describe('reorder and cross-column move under an active search filter (defect-1 regression)', () => {
  it('same-column reorder resolves the target by id even while a filter hides the card between them', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    // Add a 3rd "todo" card tagged "Diseño" so a query can show the 1st and 3rd
    // cards while hiding the 2nd ("Investigar proveedor de pagos", tag Backend).
    await user.click(within(columnFor('Por hacer')).getByText('+ Añadir tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea filtrable')
    await user.type(screen.getByPlaceholderText('Frontend, Bug, API'), 'Diseño')
    await user.click(screen.getByText('Guardar'))

    // Real "todo" = [Diseñar sistema de notificaciones (tag Diseño), Investigar
    // proveedor de pagos (tag Backend), Tarea filtrable (tag Diseño)].
    await user.type(screen.getByPlaceholderText('Buscar tareas, etiquetas, personas...'), 'diseño')

    const todoColumn = columnFor('Por hacer')
    expect(within(todoColumn).queryByText('Investigar proveedor de pagos')).not.toBeInTheDocument()

    dragAndDrop(seedCard('Diseñar sistema de notificaciones'), cardByTitle('Tarea filtrable'))

    await user.clear(screen.getByPlaceholderText('Buscar tareas, etiquetas, personas...'))

    const todoColumnAfter = columnFor('Por hacer')
    const titles = within(todoColumnAfter)
      .getAllByText(/Diseñar sistema de notificaciones|Investigar proveedor de pagos|Tarea filtrable/)
      .map((el) => el.textContent)
    // The hidden card ("Investigar...") must land BEFORE the dragged card in the
    // real array: id-based resolution ignores the filtered view entirely.
    expect(titles).toEqual(['Investigar proveedor de pagos', 'Diseñar sistema de notificaciones', 'Tarea filtrable'])
  })

  it('cross-column move resolves the target by its real index, not its filtered index', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    // Query "diseño" matches only "Diseñar sistema de notificaciones" (todo, tag
    // Diseño) and "Rediseñar onboarding móvil" (doing, tag Diseño); it hides
    // "Integrar API de autenticación" (doing, real index 0), which stays between
    // the seam even though it is invisible during the drag.
    await user.type(screen.getByPlaceholderText('Buscar tareas, etiquetas, personas...'), 'diseño')

    const doingColumn = columnFor('En progreso')
    expect(within(doingColumn).queryByText('Integrar API de autenticación')).not.toBeInTheDocument()

    dragAndDrop(seedCard('Diseñar sistema de notificaciones'), seedCard('Rediseñar onboarding móvil'))

    await user.clear(screen.getByPlaceholderText('Buscar tareas, etiquetas, personas...'))

    const doingColumnAfter = columnFor('En progreso')
    const titles = within(doingColumnAfter)
      .getAllByText(/Integrar API de autenticación|Rediseñar onboarding móvil|Diseñar sistema de notificaciones/)
      .map((el) => el.textContent)
    expect(titles).toEqual([
      'Integrar API de autenticación',
      'Diseñar sistema de notificaciones',
      'Rediseñar onboarding móvil',
    ])
  })
})
