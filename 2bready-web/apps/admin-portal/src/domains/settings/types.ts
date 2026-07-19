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
