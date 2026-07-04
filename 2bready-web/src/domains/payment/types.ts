// Local types — see domains/package/types.ts for why.

export type PaymentMethod = 'stripe' | 'manual_bank_transfer';
export type PaymentStatus = 'pending' | 'awaiting_confirmation' | 'confirmed' | 'failed' | 'rejected';
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export type Subscription = {
  id: string;
  company_id: string;
  package: import('@/domains/package/types').Package | null;
  status: SubscriptionStatus;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Payment = {
  id: string;
  company_id: string;
  subscription_id: string;
  amount_cents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway_reference: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type BankTransferGatewayData = {
  bank_name: string;
  account_name: string;
  account_number: string;
  reference: string;
  amount_cents: number;
  currency: string;
};

export type StripeGatewayData = {
  stub: true;
  client_secret: string;
  amount_cents: number;
  currency: string;
};

export type SubscribeResult = {
  subscription: Subscription;
  payment: Payment;
  gateway_data: BankTransferGatewayData | StripeGatewayData;
};

export type LeadPayload = {
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  source?: string;
};

export type Lead = {
  id: string;
  company_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  source: string;
  created_at: string;
};
