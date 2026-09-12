import type { Theme } from '../types.ts'

const CSS_VAR_NAME: Record<keyof Theme, string> = {
  pageBg: '--kb-page-bg',
  textPrimary: '--kb-text-primary',
  textSecondary: '--kb-text-secondary',
  textMuted: '--kb-text-muted',
  panelBg: '--kb-panel-bg',
  cardBg: '--kb-card-bg',
  cardBorder: '--kb-card-border',
  cardHoverBorder: '--kb-card-hover-border',
  inputBg: '--kb-input-bg',
  inputBorder: '--kb-input-border',
  badgeBg: '--kb-badge-bg',
  modalBg: '--kb-modal-bg',
  overlayBg: '--kb-overlay-bg',
  addHover: '--kb-add-hover',
  cancelBg: '--kb-cancel-bg',
}

export type CssVarMap = Record<string, string>

export function toCssVars(theme: Theme): CssVarMap {
  const vars: CssVarMap = {}
  for (const [token, cssVarName] of Object.entries(CSS_VAR_NAME) as Array<
    [keyof Theme, string]
  >) {
    vars[cssVarName] = theme[token]
  }
  return vars
}
