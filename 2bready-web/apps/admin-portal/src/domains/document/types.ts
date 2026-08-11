// Local types — see domains/package/types.ts for why.

export type DocumentStatus = 'pending_scan' | 'scan_failed' | 'review' | 'verified' | 'rejected' | 'expired';

export type Document = {
  id: string;
  document_template_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  comment: string | null;
  verified_at: string | null;
  expires_at: string | null;
  created_at: string;
  company: { id: string; name: string } | null;
  document_template: { id: string; name: string } | null;
};
