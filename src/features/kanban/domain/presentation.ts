import type { Priority, ThemeMode } from './types.ts'

interface TagColorPair {
  bg: string
  fg: string
}

const TAG_PALETTE_LIGHT: readonly TagColorPair[] = [
  { bg: 'oklch(0.7 0.16 300 / 0.16)', fg: 'oklch(0.5 0.2 300)' },
  { bg: 'oklch(0.7 0.16 250 / 0.16)', fg: 'oklch(0.5 0.2 250)' },
  { bg: 'oklch(0.7 0.16 190 / 0.18)', fg: 'oklch(0.45 0.15 190)' },
  { bg: 'oklch(0.7 0.16 140 / 0.18)', fg: 'oklch(0.42 0.15 140)' },
  { bg: 'oklch(0.75 0.17 70 / 0.2)', fg: 'oklch(0.45 0.16 70)' },
  { bg: 'oklch(0.7 0.2 25 / 0.16)', fg: 'oklch(0.5 0.22 25)' },
]

const TAG_PALETTE_DARK: readonly TagColorPair[] = [
  { bg: 'oklch(0.4 0.13 300 / 0.35)', fg: 'oklch(0.85 0.1 300)' },
  { bg: 'oklch(0.4 0.13 250 / 0.35)', fg: 'oklch(0.85 0.1 250)' },
  { bg: 'oklch(0.4 0.13 190 / 0.35)', fg: 'oklch(0.85 0.1 190)' },
  { bg: 'oklch(0.4 0.13 140 / 0.35)', fg: 'oklch(0.85 0.1 140)' },
  { bg: 'oklch(0.45 0.14 70 / 0.35)', fg: 'oklch(0.85 0.1 70)' },
  { bg: 'oklch(0.4 0.16 25 / 0.35)', fg: 'oklch(0.85 0.12 25)' },
]

const AVATAR_PALETTE: readonly string[] = [
  'oklch(0.62 0.23 300)',
  'oklch(0.62 0.2 250)',
  'oklch(0.68 0.18 190)',
  'oklch(0.65 0.17 140)',
  'oklch(0.72 0.18 70)',
  'oklch(0.62 0.22 25)',
]

interface PriorityMeta {
  bg: string
  fg: string
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  Alta: { bg: 'oklch(0.62 0.24 25)', fg: '#fff' },
  Media: { bg: 'oklch(0.78 0.18 70)', fg: 'oklch(0.32 0.1 70)' },
  Baja: { bg: 'oklch(0.72 0.15 165)', fg: 'oklch(0.28 0.08 165)' },
}

export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const result = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
  return result || '?'
}

export interface TagChip {
  label: string
  bg: string
  fg: string
}

export function tagChip(tag: string, mode: ThemeMode): TagChip {
  const palette = mode === 'dark' ? TAG_PALETTE_DARK : TAG_PALETTE_LIGHT
  const c = palette[hashStr(tag) % palette.length]
  return { label: tag, bg: c.bg, fg: c.fg }
}

export function avatarColor(name: string): string {
  return AVATAR_PALETTE[hashStr(name) % AVATAR_PALETTE.length]
}

export function priorityMeta(priority: Priority): PriorityMeta {
  return PRIORITY_META[priority] ?? PRIORITY_META.Media
}
