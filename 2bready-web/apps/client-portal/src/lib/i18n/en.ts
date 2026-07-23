const en = {
  // ─── Nav labels ──────────────────────────────────────────────────────────
  'nav.overview': 'Overview',
  'nav.journey': 'Compliance Journey',
  'nav.audits': 'Audits',
  'nav.documents': 'Documents',
  'nav.trust_badge': 'Trust Badge',
  'nav.data_room': 'Data Room',
  'nav.sops': 'SOPs',
  'nav.billing': 'Billing',
  'nav.settings': 'Company Settings',
  'nav.support': 'Support',
  'nav.more': 'More',
  'nav.open_menu': 'Open menu',

  // ─── Nav descriptions ────────────────────────────────────────────────────
  'nav.journey_desc': 'Your guided, step-by-step compliance checklist will appear here.',
  'nav.audits_desc': 'Audit requests, status, and findings for your company will appear here.',
  'nav.documents_desc': 'Upload and manage your compliance documents here.',
  'nav.trust_badge_desc': 'Your shareable trust badge and public status page will appear here.',
  'nav.data_room_desc': 'Generate a secure, password-protected link to share your verified compliance documents with investors and banks.',
  'nav.sops_desc': 'Your standard operating procedures library will appear here.',
  'nav.billing_desc': 'Your subscription plan and payment history will appear here.',
  'nav.settings_desc': 'Your company profile and account settings will appear here.',
  'nav.support_desc': 'Contact support and view your open tickets here.',

  // ─── Overview page ───────────────────────────────────────────────────────
  'overview.title': 'Your compliance readiness, at a glance',
  'overview.subtitle': 'Track your journey, manage documents, and stay audit-ready — all in one place.',
  'overview.cta': 'Continue your journey',

  // ─── Domain stub page ────────────────────────────────────────────────────
  'stub.coming_soon': 'Coming soon',

  // ─── Theme toggle ────────────────────────────────────────────────────────
  'theme.toggle': 'Toggle color scheme',
  'theme.light': 'Light mode — click for dark',
  'theme.dark': 'Dark mode — click for system',
  'theme.system': 'System theme — click for light',
  'theme.section_label': 'Theme',
  'theme.light_label': 'Light',
  'theme.dark_label': 'Dark',
  'theme.system_label': 'System',

  // ─── Header ──────────────────────────────────────────────────────────────
  'header.language': 'Language',
  'header.notifications': 'Notifications',
  'header.no_notifications': 'No notifications yet',
  'header.account': 'Account',
  'header.sign_out': 'Sign out',

  // ─── Company suspended lockout screen ───────────────────────────────────
  'company_suspended.title': 'Account suspended',
  'company_suspended.body': "{company}'s account is currently suspended. You won't be able to access compliance data until this is resolved.",

  // ─── Email verification lockout ─────────────────────────────────────────
  'email_verification.title': 'Verify your email',
  'email_verification.body': "We sent a verification link to {email}. Please check your inbox and click the link to continue — you won't be able to access your compliance data until it's verified.",
  'email_verification.resend': 'Resend verification email',
  'email_verification.resent': 'Verification email sent.',

  // ─── Compliance Journey ──────────────────────────────────────────────────
  'journey.history_missing_label': 'Missing',
  'journey.history_backfill_upload': 'Upload',
  'journey.upload_backfill_notice': 'Filing for {period} — a past period',
  'journey.history_missing_caption': 'No filing was submitted for this period',
  'journey.history_current_label': 'Current',
  'journey.history_gap_count': '{count} missed',
  'journey.history_show_all': 'Show all {count} months',
  'journey.history_show_earlier': 'Show {count} earlier months',
  'journey.recurrence_monthly': 'Monthly filing',
  'journey.recurrence_annual': 'Annual filing',
  'journey.recurrence_expires_in': 'Expires in {months}mo',

  // ─── Data Room ───────────────────────────────────────────────────────────
  'data_room.desc_locked': 'The Smart Data Room generates a time-limited, password-protected link so investors and banks can review your most advanced compliance documents without exposing your full vault.',
  'data_room.desc_unlocked': 'The Smart Data Room generates a time-limited, password-protected link so investors and banks can review your L3 & L4 verified documents without exposing your full vault.',
  'data_room.locked_title': 'Locked',
  'data_room.locked_desc': 'Requires the Enterprise plan and 100% verification of L4 · {level} ({total} documents across {milestones} milestones). {verified} of {total} verified today.',
  'data_room.upgrade_cta': 'Upgrade to Enterprise →',
  'data_room.features_title': "What you'll get",
  'data_room.features_subtitle': 'Available once L4 is 100% verified on the Enterprise plan',
  'data_room.shared_title': "What's shared",
  'data_room.shared_subtitle': 'L3 & L4 verified documents only — L1/L2 stay private',
  'data_room.feature_one_link_title': 'One secure link',
  'data_room.feature_one_link_desc': 'A single shareable link for investors, banks, or partners — no account or login required on their end.',
  'data_room.feature_expiry_title': '7-day expiry',
  'data_room.feature_expiry_desc': 'Every link auto-expires 7 days after generation. Generate a fresh one whenever you need to re-share.',
  'data_room.feature_password_title': 'Password-protected',
  'data_room.feature_password_desc': 'A one-time password is shown alongside the link at creation — required to view the room.',
  'data_room.feature_filter_title': 'L3 & L4 documents only',
  'data_room.feature_filter_desc': 'Foundational L1/L2 paperwork stays private — only your Gold and Platinum-tier documents are shared.',
  'data_room.link_card_title': 'Your secure link',
  'data_room.status_active': 'Active',
  'data_room.status_expired': 'Expired',
  'data_room.status_revoked': 'Revoked',
  'data_room.no_link_desc': 'No active link yet. Generate one to share your L3 & L4 verified documents with an investor or bank.',
  'data_room.generate_button': 'Generate secure link',
  'data_room.generating': 'Generating…',
  'data_room.link_label': 'Shareable link',
  'data_room.pin_label': 'One-time password (shown only now — save it)',
  'data_room.expires_label': 'Expires {date}',
  'data_room.regenerate_button': 'Generate new link',
  'data_room.revoke_button': 'Revoke',
  'data_room.confirm_regenerate_title': 'Generate a new link?',
  'data_room.confirm_regenerate_desc': 'This immediately revokes your current link — anyone holding it will lose access. Only the new link and password will work afterward.',
  'data_room.confirm_regenerate_action': 'Generate new link',
  'data_room.confirm_revoke_title': 'Revoke this link?',
  'data_room.confirm_revoke_desc': "Anyone holding this link will immediately lose access. This can't be undone — you'll need to generate a new link to share again.",
  'data_room.confirm_revoke_action': 'Revoke',
  'data_room.toast_generated': 'Secure link generated.',
  'data_room.toast_revoked': 'Link revoked.',

  // ─── Data Room — public PIN-entry page (unauthenticated) ────────────────
  'public_data_room.title': 'Smart Data Room',
  'public_data_room.subtitle': 'Enter the password shared with this link to view the documents.',
  'public_data_room.password_label': 'Password',
  'public_data_room.password_placeholder': '8-character password',
  'public_data_room.submit_button': 'View documents',
  'public_data_room.shared_docs_desc': 'Verified compliance documents shared via Smart Data Room.',
  'public_data_room.incorrect_pin': 'Incorrect PIN.',
  'public_data_room.generic_error': 'Could not verify this link.',
  'public_data_room.preview_error': 'Could not load this document.',
} as const;

export default en;
