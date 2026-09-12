import { describe, expect, it } from 'vitest'
import { isColumnId } from './types.ts'

describe('isColumnId', () => {
  it('accepts every real column id', () => {
    expect(isColumnId('todo')).toBe(true)
    expect(isColumnId('doing')).toBe(true)
    expect(isColumnId('review')).toBe(true)
    expect(isColumnId('done')).toBe(true)
  })

  it('rejects unrelated strings', () => {
    expect(isColumnId('')).toBe(false)
    expect(isColumnId('Todo')).toBe(false) // case-sensitive
    expect(isColumnId('archived')).toBe(false)
    expect(isColumnId('todo ')).toBe(false) // no implicit trim
  })
})
