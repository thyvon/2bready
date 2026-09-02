import api from '@/lib/api';
import type { components } from '@2bready/api-client';

export type SignoffDocument = components['schemas']['SignoffDocumentResource'];

/** Company documents (BelongsToCompany scope; internal roles see all). */
export async function listSignoffDocuments(filters?: {
  status?: string;
  category?: string;
}): Promise<SignoffDocument[]> {
  const res = await api.get<{ data: SignoffDocument[] }>('/signoff-documents', { params: filters });
  return res.data.data;
}

/** Send a verified journey document to staff for signoff. */
export async function sendJourneyDocumentToStaff(documentId: string, userIds: string[]): Promise<void> {
  await api.post(`/signoff-documents/send-journey-document/${documentId}`, { user_ids: userIds });
}

// ─── Staff side ("shared with me") ──────────────────────────────────────────

/** One row of the staff's shared-with-me list. */
export type MySignoffDocumentRow = {
  id: number;
  signed_at: string | null;
  emailed_at: string | null;
  document: SignoffDocument;
};

export async function listMySignoffDocuments(): Promise<MySignoffDocumentRow[]> {
  const res = await api.get<{ data: MySignoffDocumentRow[] }>('/my-signoff-documents');
  return res.data.data;
}

/** Acknowledge a document shared with me. rowId = signoff_document_users.id */
export async function acknowledgeMySignoffDocument(rowId: number): Promise<void> {
  await api.post(`/my-signoff-documents/${rowId}/acknowledge`);
}
