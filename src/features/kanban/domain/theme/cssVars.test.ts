import { describe, expect, it } from 'vitest'
import { toCssVars } from './cssVars.ts'
import { lightTheme } from './tokens.ts'

describe('toCssVars', () => {
  it('maps every token to its --kb-* custom property', () => {
    const vars = toCssVars(lightTheme)

    expect(vars['--kb-page-bg']).toBe(lightTheme.pageBg)
    expect(vars['--kb-text-primary']).toBe(lightTheme.textPrimary)
    expect(vars['--kb-text-secondary']).toBe(lightTheme.textSecondary)
    expect(vars['--kb-text-muted']).toBe(lightTheme.textMuted)
    expect(vars['--kb-panel-bg']).toBe(lightTheme.panelBg)
    expect(vars['--kb-card-bg']).toBe(lightTheme.cardBg)
    expect(vars['--kb-card-border']).toBe(lightTheme.cardBorder)
    expect(vars['--kb-card-hover-border']).toBe(lightTheme.cardHoverBorder)
    expect(vars['--kb-input-bg']).toBe(lightTheme.inputBg)
    expect(vars['--kb-input-border']).toBe(lightTheme.inputBorder)
    expect(vars['--kb-badge-bg']).toBe(lightTheme.badgeBg)
    expect(vars['--kb-modal-bg']).toBe(lightTheme.modalBg)
    expect(vars['--kb-overlay-bg']).toBe(lightTheme.overlayBg)
    expect(vars['--kb-add-hover']).toBe(lightTheme.addHover)
    expect(vars['--kb-cancel-bg']).toBe(lightTheme.cancelBg)
  })

  it('produces exactly 15 custom properties, one per token', () => {
    expect(Object.keys(toCssVars(lightTheme))).toHaveLength(15)
  })
})
