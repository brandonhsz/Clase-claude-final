// Maps every accepted Spanish month spelling (abbreviated and full) to its
// 1-12 month number.
const MONTH_INDEX: Record<string, number> = {
  ene: 1,
  enero: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  ago: 8,
  agosto: 8,
  sep: 9,
  septiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dic: 12,
  diciembre: 12,
}

// Days per month (1-indexed via `month - 1`), February handled separately.
const DAYS_IN_MONTH: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

/**
 * Days in `month` (1-12). Without a `year`, February permits day 29 as a
 * permanent leap-day allowance (no year is captured to check against). With a
 * `year`, February's real leap-year status is checked instead.
 */
function daysInMonth(month: number, year?: number): number {
  if (month === 2) {
    return year === undefined || isLeapYear(year) ? 29 : 28
  }
  return DAYS_IN_MONTH[month - 1]
}

function isValidCalendarDay(day: number, month: number, year?: number): boolean {
  if (month < 1 || month > 12) return false
  return day >= 1 && day <= daysInMonth(month, year)
}

const NAMED_MONTH_PATTERN = /^(\d{1,2})\s+([a-zA-Záéíóúñ]+)$/
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const NUMERIC_PATTERN = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/

/**
 * Validates the "Fecha límite" field per specs/task-management/spec.md's
 * "Due-Date Format Validation" requirement. An empty (or whitespace-only)
 * value is valid — it defaults to "Sin fecha" downstream. A non-empty value
 * must match one of:
 *   - "<day> <spanish month abbreviation>"   (e.g. "20 sep")
 *   - "<day> <full spanish month name>"      (e.g. "20 septiembre")
 *   - "DD/MM" or "DD/MM/YYYY"                (e.g. "20/09", "20/09/2026")
 *   - ISO "YYYY-MM-DD"                       (e.g. "2026-09-20")
 * with the day in range for that month. Year-less forms (named month, or
 * DD/MM without a year) grant Feb 29 a permanent leap-day allowance;
 * year-bearing forms (DD/MM/YYYY, ISO) validate Feb 29 against the real
 * leap-year status of that year.
 */
export function isValidDueDate(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true

  const namedMatch = NAMED_MONTH_PATTERN.exec(trimmed)
  if (namedMatch) {
    const day = Number(namedMatch[1])
    const month = MONTH_INDEX[namedMatch[2].toLowerCase()]
    if (month === undefined) return false
    return isValidCalendarDay(day, month) // no year -> leap-day allowance
  }

  const isoMatch = ISO_PATTERN.exec(trimmed)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    return isValidCalendarDay(day, month, year)
  }

  const numericMatch = NUMERIC_PATTERN.exec(trimmed)
  if (numericMatch) {
    const day = Number(numericMatch[1])
    const month = Number(numericMatch[2])
    const year = numericMatch[3] === undefined ? undefined : Number(numericMatch[3])
    return isValidCalendarDay(day, month, year)
  }

  return false
}
