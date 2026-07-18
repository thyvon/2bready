// Shared "standalone card in a stacked list" elevation convention: no
// border, a quiet neutral resting shadow, hover deepens it. One source of
// truth so admin-portal and client-portal can't silently drift apart on
// separate edits to the same visual recipe.
export const cardRestShadow = '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.10)';

// admin-portal is deliberately monochrome (see its theme's MuiButton
// override) — hover just deepens the same neutral shadow, never a color.
export const cardHoverShadowNeutral = '0 4px 6px -1px rgba(0,0,0,0.1), 0 8px 24px -8px rgba(0,0,0,0.15)';

// client-portal's brand glow — same recipe as GlowButton/PillarCard, a
// colored ring + blurred shadow tinted by the given CSS color/variable.
export function cardHoverGlow(color: string = 'var(--mui-palette-primary-main)'): string {
  return `0 0 0 1px color-mix(in srgb, ${color} 15%, transparent), 0 8px 24px -8px color-mix(in srgb, ${color} 50%, transparent)`;
}
