import { describe, expect, it } from 'vitest'
import { avatarColor, hashStr, initials, tagChip } from './presentation.ts'

describe('hashStr', () => {
  it('is deterministic for the same input', () => {
    expect(hashStr('Backend')).toBe(hashStr('Backend'))
  })

  it('differs for different inputs (no trivial collision)', () => {
    expect(hashStr('Backend')).not.toBe(hashStr('Frontend'))
  })
})

describe('initials', () => {
  it('returns a single uppercase initial for a one-word name', () => {
    expect(initials('Ana')).toBe('A')
  })

  it('returns two uppercase initials for a two-word name', () => {
    expect(initials('Diego Ruiz')).toBe('DR')
  })

  it('returns "?" for an empty name', () => {
    expect(initials('')).toBe('?')
  })
})

describe('tagChip', () => {
  it('gives the same tag the identical color pair across calls in the same theme', () => {
    const a = tagChip('Backend', 'light')
    const b = tagChip('Backend', 'light')
    expect(a).toEqual(b)
  })

  it('gives the same tag a stable color pair per theme mode', () => {
    const light = tagChip('Backend', 'light')
    const dark = tagChip('Backend', 'dark')
    expect(light).not.toEqual(dark)
  })
})

describe('avatarColor', () => {
  it('is stable for the same name across calls', () => {
    expect(avatarColor('Ana Ortiz')).toBe(avatarColor('Ana Ortiz'))
  })

  it('differs for different names (no trivial collision)', () => {
    // avatarColor's signature takes only a `name` — no theme parameter exists
    // to vary, so theme-independence is a structural fact, not something a
    // unit test can meaningfully assert beyond "the function is deterministic
    // per name" (covered above). This test instead checks discriminating
    // power, which the previous duplicate of the stability test did not.
    expect(avatarColor('Diego Ruiz')).not.toBe(avatarColor('Ana Ortiz'))
  })
})
