import api from '@/lib/api';
import type { components } from '@2bready/api-client';

export type Subscription = components['schemas']['SubscriptionResource'];
export type Payment = components['schemas']['PaymentResource'];

// Scramble can't infer a shape for this — it's a raw array returned by
// whichever PaymentGatewayInterface implementation handled `initiate()` (see
// 2bready-api's PaymentGatewayResolver). Typed here to match
// ManualBankTransferGateway::initiate() specifically, since that's the only
// method this app offers (see subscribeToPackage's own comment).
export interface BankTransferGatewayData {
  bank_name: string;
  account_name: string;
  account_number: string;
  reference: string;
  amount_cents: number;
  currency: string;
}

export interface SubscribeResult {
  subscription: Subscription;
  payment: Payment;
  gateway_data: BankTransferGatewayData;
}

// Manual bank transfer only — Stripe is a disclosed backend stub
// (FakeStripeGateway returns a meaningless fake client_secret, no real
// Stripe Elements integration exists), so it isn't offered as a selectable
// checkout method here; that would show the user something that isn't real.
export async function subscribeToPackage(packageId: string): Promise<SubscribeResult> {
  const res = await api.post<{ data: SubscribeResult }>('/subscriptions', {
    package_id: packageId,
    method: 'manual_bank_transfer',
  });
  return res.data.data;
}

export async function listMySubscriptions(): Promise<Subscription[]> {
  const res = await api.get<{ data: Subscription[] }>('/subscriptions');
  return res.data.data;
}

export async function listMyPayments(): Promise<Payment[]> {
  const res = await api.get<{ data: Payment[] }>('/payments');
  return res.data.data;
}

// Company self-reports having sent the transfer — a human (admin/finance)
// still confirms it for real via the admin-portal payments queue before the
// subscription actually activates.
export async function submitManualPayment(paymentId: string): Promise<Payment> {
  const res = await api.post<{ data: Payment }>(`/payments/${paymentId}/submit`);
  return res.data.data;
}
