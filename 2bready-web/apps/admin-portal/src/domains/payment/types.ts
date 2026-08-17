// Local types — see domains/package/types.ts for why.

// Subscribing is company-side self-service (client-portal's responsibility) —
// this app only confirms/rejects payments on 2bReady's behalf, so subscription
// and gateway-data shapes (SubscribeResult, BankTransferGatewayData,
// StripeGatewayData, Subscription) don't live here.

export type PaymentMethod = 'stripe' | 'manual_bank_transfer';
export type PaymentStatus = 'pending' | 'awaiting_confirmation' | 'confirmed' | 'failed' | 'rejected';

export type Payment = {
  id: string;
  company_id: string;
  // Present when eager-loaded (back-office queue) — see PaymentResource.
  company?: { id: string; name: string } | null;
  payable_id: string;
  // Short morph alias from the backend (see AppServiceProvider's morph map) —
  // 'subscription' for a package purchase, 'tp_hire' for a TP-hire engagement.
  payable_type: 'subscription' | 'tp_hire';
  amount_cents: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway_reference: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
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
