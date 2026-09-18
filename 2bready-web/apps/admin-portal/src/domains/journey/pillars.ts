export type Tier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface Pillar {
  id: 'verify' | 'connect' | 'grow';
  tier: Tier;
}

// Marketing-style grouping of the 4 real levels into 3 pillars — mirrors
// client-portal's own PILLARS (journey-data.ts). Only the id/tier live here;
// display copy (label/name/sub/description) is translated via journey.pillar_*
// keys in lib/i18n, not hardcoded English like the client-portal source.
export const PILLARS: Pillar[] = [
  { id: 'verify', tier: 'starter' },
  { id: 'connect', tier: 'pro' },
  { id: 'grow', tier: 'enterprise' },
];
