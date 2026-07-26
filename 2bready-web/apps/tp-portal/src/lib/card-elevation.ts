// Shared "standalone card in a stacked list" elevation convention: no
// border, a quiet neutral resting shadow, hover deepens it — never a colored
// glow (see theme/index.ts's MuiButton override: this app is deliberately
// monochrome). One source of truth so the per-company Journey tab and the
// Journey Templates taxonomy editor can't drift apart on separate edits.
// client-portal has the same values (plus a colored hover variant) exported
// from `@2bready/ui-core`'s cardElevation.ts.
export const cardRestShadow = '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.10)';
export const cardHoverShadowNeutral = '0 4px 6px -1px rgba(0,0,0,0.1), 0 8px 24px -8px rgba(0,0,0,0.15)';
