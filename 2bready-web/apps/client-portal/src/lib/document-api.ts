import api from '@/lib/api';
import type { components } from '@2bready/api-client';

export type Document = components['schemas']['DocumentResource'];

// `documentTemplateId` is the id shown on each JourneyDocument (see
// journey-api.ts's mapDocument on the backend — it deliberately returns the
// DocumentTemplate's id, not a prior Document row's id, since a milestone's
// checklist item is always keyed by its template regardless of upload
// history). MIME/size are validated server-side before the file ever
// touches storage or the scan job (CLAUDE.md's non-negotiable rule) —
// nothing is re-validated here.
export async function uploadDocument(documentTemplateId: string, file: File): Promise<Document> {
  const formData = new FormData();
  formData.append('document_template_id', documentTemplateId);
  formData.append('file', file);

  const res = await api.post<{ data: Document }>('/documents', formData);
  return res.data.data;
}

export interface DocumentPreview {
  url: string;
  mime_type: string;
  original_filename: string;
}

// Short-lived (5 min) signed URL — real Document row id (JourneyDocument's
// `document_id`, not its `id` which is the DocumentTemplate's id). The
// generated type marks `document_id` as always-string (a Scramble
// inference gap on the `?->id` null-safe chain server-side); it's genuinely
// nullable until a document is actually uploaded, so callers must guard for
// that themselves rather than trust the type.
export async function getPreviewUrl(documentId: string): Promise<DocumentPreview> {
  const res = await api.get<{ data: DocumentPreview }>(`/documents/${documentId}/preview-url`);
  return res.data.data;
}
