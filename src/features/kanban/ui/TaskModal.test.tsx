import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { KanbanBoard } from './KanbanBoard.tsx'

function cardFor(title: string): HTMLElement {
  return screen.getByText(title).closest('[data-testid^="card-"]') as HTMLElement
}

describe('create task', () => {
  it('opens with title "Nueva tarea", empty fields, priority "Media", and no delete button', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))

    expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre de la tarea')).toHaveValue('')
    expect(screen.getByPlaceholderText('Nombre')).toHaveValue('')
    expect(screen.getByLabelText('Prioridad')).toHaveValue('Media')
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('creates a card with defaults for blank assignee/due and parses tags', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea nueva')
    await user.type(screen.getByPlaceholderText('Frontend, Bug, API'), ' Frontend ,, Bug ')
    await user.click(screen.getByText('Guardar'))

    const newCard = cardFor('Tarea nueva')
    // Assignee defaults to "Sin asignar" -> avatar initials "SA"; card shows due text directly.
    expect(within(newCard).getByText('SA')).toBeInTheDocument()
    expect(within(newCard).getByText('Sin fecha')).toBeInTheDocument()
    expect(within(newCard).getByText('Frontend')).toBeInTheDocument()
    expect(within(newCard).getByText('Bug')).toBeInTheDocument()
  })

  it('discards the save when the title is blank or whitespace-only', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), '   ')
    await user.click(screen.getByText('Guardar'))

    // Modal closes, no new card, no stray card titled with whitespace.
    expect(screen.queryByText('Nueva tarea')).not.toBeInTheDocument()
  })

  it('rejects an invalid due date: keeps the modal open, shows an error, and does not create the card', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea con fecha mala')
    await user.type(screen.getByPlaceholderText('Ej: 20 sep'), '32 sep')
    await user.click(screen.getByText('Guardar'))

    // Modal stays open with an inline error; no card was created.
    expect(screen.getByText('Nueva tarea')).toBeInTheDocument()
    expect(screen.getByText('Fecha límite inválida')).toBeInTheDocument()
    expect(screen.queryByText('Tarea con fecha mala')).not.toBeInTheDocument()
  })

  it('error clears on further edit of the due field, without clicking Guardar again', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea con fecha mala')
    await user.type(screen.getByPlaceholderText('Ej: 20 sep'), 'mañana')
    await user.click(screen.getByText('Guardar'))

    // The error MUST actually appear first — asserting only its later absence
    // would pass vacuously on a page that never showed it.
    expect(screen.getByText('Fecha límite inválida')).toBeInTheDocument()

    // Edit the due field again WITHOUT clicking Guardar.
    await user.type(screen.getByPlaceholderText('Ej: 20 sep'), '0')

    await waitFor(() =>
      expect(screen.queryByText('Fecha límite inválida')).not.toBeInTheDocument(),
    )
  })

  it('blank title wins over due-date validation: modal closes, no card created', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    // Title left blank AND due is invalid — title validation (a discard) must
    // win over the due-date gate; the modal must still close.
    await user.type(screen.getByPlaceholderText('Ej: 20 sep'), '32 sep')
    await user.click(screen.getByText('Guardar'))

    expect(screen.queryByText('Nueva tarea')).not.toBeInTheDocument()
    expect(screen.queryByText('Fecha límite inválida')).not.toBeInTheDocument()
  })

  it('accepts a valid due date and creates the card', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea con fecha buena')
    await user.type(screen.getByPlaceholderText('Ej: 20 sep'), '20 sep')
    await user.click(screen.getByText('Guardar'))

    expect(screen.queryByText('Nueva tarea')).not.toBeInTheDocument()
    expect(within(cardFor('Tarea con fecha buena')).getByText('20 sep')).toBeInTheDocument()
  })

  it('accepts an ISO due date via the same field (loosened format, not just the abbreviation)', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea con fecha ISO')
    await user.type(screen.getByPlaceholderText('Ej: 20 sep'), '2026-09-20')
    await user.click(screen.getByText('Guardar'))

    expect(screen.queryByText('Nueva tarea')).not.toBeInTheDocument()
    expect(within(cardFor('Tarea con fecha ISO')).getByText('2026-09-20')).toBeInTheDocument()
  })

  it('drives the column <select> directly: creating in a non-default column appends there', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('+ Nueva tarea'))
    await user.selectOptions(screen.getByLabelText('Columna'), 'review')
    await user.type(screen.getByPlaceholderText('Nombre de la tarea'), 'Tarea para revisión')
    await user.click(screen.getByText('Guardar'))

    const reviewColumn = screen.getByTestId('column-review')
    expect(within(reviewColumn).getByText('Tarea para revisión')).toBeInTheDocument()
  })
})

describe('edit task', () => {
  it('opens with title "Editar tarea", pre-filled fields, tags joined by ", ", and a delete button', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('Corregir bug de sincronización'))

    expect(screen.getByText('Editar tarea')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre de la tarea')).toHaveValue('Corregir bug de sincronización')
    expect(screen.getByPlaceholderText('Frontend, Bug, API')).toHaveValue('Bug, API')
    expect(screen.getByPlaceholderText('Nombre')).toHaveValue('Ana Ortiz')
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('preserves the card position when the column is unchanged', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    // "todo" is [Diseñar sistema de notificaciones, Investigar proveedor de pagos]
    await user.click(screen.getByText('Diseñar sistema de notificaciones'))
    const titleInput = screen.getByPlaceholderText('Nombre de la tarea')
    await user.clear(titleInput)
    await user.type(titleInput, 'Diseñar sistema (editado)')
    await user.click(screen.getByText('Guardar'))

    const titles = screen.getAllByText(/Diseñar sistema|Investigar proveedor de pagos/)
    expect(titles[0]).toHaveTextContent('Diseñar sistema (editado)')
    expect(titles[1]).toHaveTextContent('Investigar proveedor de pagos')
  })

  it('changing the column via the <select> moves the card there on save', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    // Card 5 ("Corregir bug de sincronización") lives in "review".
    await user.click(screen.getByText('Corregir bug de sincronización'))
    expect(screen.getByLabelText('Columna')).toHaveValue('review')

    await user.selectOptions(screen.getByLabelText('Columna'), 'done')
    await user.click(screen.getByText('Guardar'))

    const reviewColumn = screen.getByTestId('column-review')
    const doneColumn = screen.getByTestId('column-done')
    expect(within(reviewColumn).queryByText('Corregir bug de sincronización')).not.toBeInTheDocument()
    expect(within(doneColumn).getByText('Corregir bug de sincronización')).toBeInTheDocument()
  })

  it('overlay click discards edits', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('Corregir bug de sincronización'))
    const titleInput = screen.getByPlaceholderText('Nombre de la tarea')
    await user.clear(titleInput)
    await user.type(titleInput, 'Cambio sin guardar')

    await user.click(screen.getByTestId('modal-overlay'))

    expect(screen.queryByText('Cambio sin guardar')).not.toBeInTheDocument()
    expect(screen.getByText('Corregir bug de sincronización')).toBeInTheDocument()
  })

  it('"Cancelar" button click discards edits', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('Corregir bug de sincronización'))
    const titleInput = screen.getByPlaceholderText('Nombre de la tarea')
    await user.clear(titleInput)
    await user.type(titleInput, 'Cambio sin guardar')

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Cambio sin guardar')).not.toBeInTheDocument()
    expect(screen.getByText('Corregir bug de sincronización')).toBeInTheDocument()
  })
})

describe('delete task', () => {
  it('removes the card and closes the modal without a confirmation dialog', async () => {
    const user = userEvent.setup()
    render(<KanbanBoard />)

    await user.click(screen.getByText('Corregir bug de sincronización'))
    await user.click(screen.getByText('Eliminar'))

    expect(screen.queryByText('Corregir bug de sincronización')).not.toBeInTheDocument()
    expect(screen.queryByText('Editar tarea')).not.toBeInTheDocument()
  })
})
