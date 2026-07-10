// TP (Third Party) Marketplace — content mined from the project owner's
// concept prototype (see project memory), not invented: 5 real audit firms
// with real per-level pricing and a 20% "special" promo price, matching the
// owner's own DEFAULT_TP array. Client-portal is the *hiring* side of this
// domain (browse/hire) — the TP's own accept/work/file-findings flow lives
// in a separate self-service portal, not here.
export type Expertise = 'food_cert' | 'finance_audit' | 'internal_control';

export const EXPERTISE_LABELS: Record<Expertise, string> = {
  food_cert: 'Food Certification',
  finance_audit: 'Finance Audit',
  internal_control: 'Internal Control',
};

export interface TpPartner {
  id: string;
  name: string;
  expertise: Expertise;
  rating: number;
  reviewCount: number;
  /** List price per audited level — the discount below is computed, not stored twice. */
  priceL2: number;
  priceL3: number;
  priceL4: number;
}

export const TP_PARTNERS: TpPartner[] = [
  { id: 'tp_1', name: 'ADMIT Global Audit', expertise: 'food_cert', rating: 4.8, reviewCount: 12, priceL2: 299, priceL3: 499, priceL4: 799 },
  { id: 'tp_2', name: 'KPMG Cambodia', expertise: 'finance_audit', rating: 4.9, reviewCount: 8, priceL2: 399, priceL3: 599, priceL4: 999 },
  { id: 'tp_3', name: 'BDO Cambodia', expertise: 'internal_control', rating: 4.6, reviewCount: 5, priceL2: 249, priceL3: 449, priceL4: 749 },
  { id: 'tp_4', name: 'Mekong Strategic Partners', expertise: 'finance_audit', rating: 4.7, reviewCount: 6, priceL2: 349, priceL3: 549, priceL4: 899 },
  { id: 'tp_5', name: 'Sophea & Associates', expertise: 'food_cert', rating: 4.5, reviewCount: 4, priceL2: 199, priceL3: 399, priceL4: 699 },
];

/** The owner's concept file applies a flat 20% marketplace promo to every listed price. */
export function specialPrice(listPrice: number): number {
  return Math.round(listPrice * 0.8);
}

// Explicit business rule: the marketplace only surfaces TPs whose expertise
// matches this client's own industry/journey — never the full, unfiltered
// audit-type directory. The company's real `industry_id` (see the Industry
// domain on 2bready-api) will drive this once a real company record exists;
// hardcoded to Food & Beverage's matching expertise for now since there's no
// company data fetch yet (UI-first, per established workflow).
export const CLIENT_MATCHING_EXPERTISE: Expertise[] = ['food_cert'];

export function matchesClientIndustry(partner: TpPartner): boolean {
  return CLIENT_MATCHING_EXPERTISE.includes(partner.expertise);
}
