import { describe, expect, it } from 'vitest'
import { isValidDueDate } from './validation.ts'

// Scenarios below mirror specs/task-management/spec.md's "Due-Date Format
// Validation" requirement exactly.

describe('isValidDueDate', () => {
  it('treats an empty string as valid (defaults to "Sin fecha")', () => {
    expect(isValidDueDate('')).toBe(true)
  })

  it('treats a whitespace-only string as valid', () => {
    expect(isValidDueDate('   ')).toBe(true)
  })

  it('accepts the abbreviated Spanish month form', () => {
    expect(isValidDueDate('20 sep')).toBe(true)
  })

  it('accepts the full Spanish month name form', () => {
    expect(isValidDueDate('20 septiembre')).toBe(true)
  })

  it('accepts numeric DD/MM', () => {
    expect(isValidDueDate('20/09')).toBe(true)
  })

  it('accepts numeric DD/MM/YYYY', () => {
    expect(isValidDueDate('20/09/2026')).toBe(true)
  })

  it('accepts ISO YYYY-MM-DD', () => {
    expect(isValidDueDate('2026-09-20')).toBe(true)
  })

  it('is case-insensitive and tolerates extra internal whitespace', () => {
    expect(isValidDueDate('  20  SEP  ')).toBe(true)
    expect(isValidDueDate('5 Mar')).toBe(true)
  })

  it('accepts Feb 29 as a permanent leap-day allowance when no year is given', () => {
    expect(isValidDueDate('29 feb')).toBe(true)
    expect(isValidDueDate('29 febrero')).toBe(true)
    expect(isValidDueDate('29/02')).toBe(true)
  })

  it('rejects a day out of range for a named month', () => {
    expect(isValidDueDate('31 sep')).toBe(false)
    expect(isValidDueDate('31 abr')).toBe(false) // April has 30 days
  })

  it('rejects day zero', () => {
    expect(isValidDueDate('0 sep')).toBe(false)
    expect(isValidDueDate('0/09')).toBe(false)
  })

  it('rejects a non-standard abbreviation', () => {
    expect(isValidDueDate('20 sept')).toBe(false)
  })

  it('rejects unrecognized text entirely', () => {
    expect(isValidDueDate('mañana')).toBe(false)
    expect(isValidDueDate('abc')).toBe(false)
    expect(isValidDueDate('sep 20')).toBe(false)
    expect(isValidDueDate('20')).toBe(false)
  })

  it('rejects Feb 29 for a non-leap year when a year is present', () => {
    expect(isValidDueDate('2025-02-29')).toBe(false)
    expect(isValidDueDate('29/02/2025')).toBe(false)
  })

  it('accepts Feb 29 for a leap year when a year is present', () => {
    expect(isValidDueDate('29/02/2028')).toBe(true)
    expect(isValidDueDate('2028-02-29')).toBe(true)
  })

  it('rejects an out-of-range month number', () => {
    expect(isValidDueDate('20/13')).toBe(false)
    expect(isValidDueDate('20/00')).toBe(false)
  })
})
