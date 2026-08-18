// Local types — see domains/package/types.ts for why.

export type VaultStatus = {
  company_id: string;
  /** Whether the company has a PIN set (if not, an admin must set one first). */
  pin_set: boolean;
  /** Whether the current back-office user holds an open unlock session. */
  unlocked: boolean;
  /** Seconds left before the server auto-locks the session (0 when locked). */
  seconds_remaining: number;
  /** Configured PIN length (platform_settings.vault_pin_length). */
  pin_length: number;
};