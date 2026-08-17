export type Tier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Pillar {
  id: 'comply' | 'scale' | 'lead';
  tier: Tier;
}

// Marketing-style grouping of the 4 real levels into 3 pillars — mirrors
// client-portal's own PILLARS (journey-data.ts). Only the id/tier live here;
// display copy (label/name/sub/description) is translated via journey.pillar_*
// keys in lib/i18n, not hardcoded English like the client-portal source.
export const PILLARS: Pillar[] = [
  { id: 'comply', tier: 'starter' },
  { id: 'scale', tier: 'pro' },
  { id: 'lead', tier: 'enterprise' },
];
