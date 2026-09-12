import type { Theme } from '../types.ts'

// Values copied verbatim from the design source. The palette mixes oklch()
// and literal #fff — never normalize these to a uniform format.
export const lightTheme: Theme = {
  pageBg: 'oklch(0.97 0.01 250)',
  textPrimary: 'oklch(0.22 0.02 260)',
  textSecondary: 'oklch(0.5 0.02 260)',
  textMuted: 'oklch(0.6 0.02 260)',
  panelBg: 'oklch(0.955 0.008 250)',
  cardBg: '#fff',
  cardBorder: 'oklch(0.93 0.008 250)',
  cardHoverBorder: 'oklch(0.88 0.01 250)',
  inputBg: '#fff',
  inputBorder: 'oklch(0.88 0.01 250)',
  badgeBg: '#fff',
  modalBg: '#fff',
  overlayBg: 'oklch(0.15 0.01 260 / 0.45)',
  addHover: 'oklch(0.92 0.01 250)',
  cancelBg: '#fff',
}

export const darkTheme: Theme = {
  pageBg: 'oklch(0.19 0.015 260)',
  textPrimary: 'oklch(0.95 0.005 250)',
  textSecondary: 'oklch(0.68 0.02 260)',
  textMuted: 'oklch(0.58 0.02 260)',
  panelBg: 'oklch(0.24 0.015 260)',
  cardBg: 'oklch(0.27 0.015 260)',
  cardBorder: 'oklch(0.33 0.015 260)',
  cardHoverBorder: 'oklch(0.4 0.02 260)',
  inputBg: 'oklch(0.24 0.015 260)',
  inputBorder: 'oklch(0.35 0.015 260)',
  badgeBg: 'oklch(0.3 0.015 260)',
  modalBg: 'oklch(0.22 0.015 260)',
  overlayBg: 'oklch(0.08 0.01 260 / 0.6)',
  addHover: 'oklch(0.32 0.015 260)',
  cancelBg: 'oklch(0.24 0.015 260)',
}
