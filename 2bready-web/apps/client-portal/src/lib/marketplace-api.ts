import api from '@/lib/api';
import type { components } from '@2bready/api-client';
import type { BankTransferGatewayData } from '@/lib/subscription-api';

export type TpPartner = components['schemas']['TpPartnerResource'];
export type TpHire = components['schemas']['TpHireResource'];
export type TpRating = components['schemas']['TpRatingResource'];
export type Payment = components['schemas']['PaymentResource'];

export interface HireResult {
  tp_hire: TpHire;
  payment: Payment;
  gateway_data: BankTransferGatewayData;
}

// Active firms only — enforced server-side (TpPartnerController::index scopes
// a company_owner caller to status=active), no client-side filtering needed.
export async function listActiveTpPartners(): Promise<TpPartner[]> {
  const res = await api.get<{ data: TpPartner[] }>('/tp-partners');
  return res.data.data;
}

// Manual bank transfer only, same reasoning as subscribeToPackage — Stripe
// isn't a real integration yet (FakeStripeGateway is a disclosed stub).
export async function hireTpPartner(tpPartnerId: string, journeyLevel: string): Promise<HireResult> {
  const res = await api.post<{ data: HireResult }>('/tp-hires/hire', {
    tp_partner_id: tpPartnerId,
    journey_level: journeyLevel,
    method: 'manual_bank_transfer',
  });
  return res.data.data;
}

export async function listMyTpHires(): Promise<TpHire[]> {
  const res = await api.get<{ data: TpHire[] }>('/tp-hires');
  return res.data.data;
}

// Company-side cancellation. Backend only allows pending_payment/active
// hires (HireNotCancellableException → 422 otherwise) and fails any open
// payments — completed hires are un-cancellable by design.
export async function cancelTpHire(tpHireId: string): Promise<TpHire> {
  const res = await api.post<{ data: TpHire }>(`/tp-hires/${tpHireId}/cancel`);
  return res.data.data;
}

export async function rateTpHire(tpHireId: string, rating: number, reviewText: string | null): Promise<TpRating> {
  const res = await api.post<{ data: TpRating }>(`/tp-hires/${tpHireId}/rate`, {
    rating,
    review_text: reviewText,
  });
  return res.data.data;
}
