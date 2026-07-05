import type { components } from '@2bready/api-client';

export type User = components['schemas']['UserResource'];
export type UserStatus = components['schemas']['UserStatus'];

export type LoginResponse = {
  user: User;
  token: string;
  totp_required: boolean;
  totp_confirmed?: boolean;
};

export type RegisterResponse = {
  user: User;
  token: string;
  totp_required: boolean;
};

export type TotpSetupResponse = {
  secret: string;
  qr_code_url: string;
};

// After login, the TOTP flow state tells the UI which screen to show.
export type TotpFlowState =
  | 'none'            // no TOTP required
  | 'setup_required'  // required but not yet enabled — show QR setup
  | 'challenge';      // enabled, need to verify code
