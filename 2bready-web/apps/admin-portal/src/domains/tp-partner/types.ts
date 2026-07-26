import type { components } from '@2bready/api-client';

export type TpPartner = components['schemas']['TpPartnerResource'];
export type User = components['schemas']['UserResource'];

export type StoreTpPartnerPayload = {
  name: string;
  name_kh?: string;
  price_l2_cents?: number;
  price_l3_cents?: number;
  price_l4_cents?: number;
};

export type UpdateTpPartnerPayload = Partial<StoreTpPartnerPayload> & { status?: 'active' | 'suspended' };

export type RegisterAuditorPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};
