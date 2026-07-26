import type { components } from '@2bready/api-client';

export type TpHire = components['schemas']['TpHireResource'];
export type Payment = components['schemas']['PaymentResource'];

export type CreateTpHirePayload = {
  company_id: string;
  tp_partner_id: string;
  journey_level: 'L2' | 'L3' | 'L4';
  method: 'manual_bank_transfer' | 'stripe';
};

export type CreateTpHireResult = {
  tp_hire: TpHire;
  payment: Payment;
  gateway_data: Record<string, unknown>;
};
