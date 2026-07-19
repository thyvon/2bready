export interface GoogleOAuthSetting {
  enabled: boolean;
  client_id: string | null;
  // The secret itself is never returned by the backend (write-only) — this
  // just tells the UI whether one has already been saved, see
  // GoogleOAuthSettingService's docblock on the API side.
  client_secret_configured: boolean;
}

export interface UpdateGoogleOAuthSettingPayload {
  enabled: boolean;
  client_id: string;
  // Omitted/empty means "keep the existing secret."
  client_secret?: string;
}

export interface MailSetting {
  host: string | null;
  port: number | null;
  username: string | null;
  encryption: 'tls' | 'ssl' | null;
  from_address: string | null;
  from_name: string | null;
  // The password itself is never returned by the backend (write-only) —
  // this just tells the UI whether one has already been saved, see
  // MailSettingService's docblock on the API side.
  password_configured: boolean;
}

export interface UpdateMailSettingPayload {
  host: string;
  port: number;
  username?: string;
  // Omitted/empty means "keep the existing password."
  password?: string;
  encryption?: 'tls' | 'ssl' | '';
  from_address: string;
  from_name: string;
}
