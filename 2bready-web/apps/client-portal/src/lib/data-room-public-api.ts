import axios from 'axios';

// Deliberately not the shared authenticated `api` client (lib/api.ts) — that
// client's interceptor clears the real session on any 401, and this page
// has no session to clear (there may not even be a logged-in user at all).
// The backend never responds 401 here anyway (a wrong PIN is 403, an
// unknown/expired/revoked token is 404), so a plain instance with no auth
// header and no interceptors is both simpler and safer.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const publicApi = axios.create({
  baseURL: `${apiUrl}/api/v1`,
  headers: { Accept: 'application/json' },
  withCredentials: false,
});

export interface DataRoomDocument {
  id: string;
  name: string;
  mime_type: string;
}

export interface DataRoomVerifyResult {
  view_session: string;
  company_name: string;
  documents: DataRoomDocument[];
}

export interface DataRoomPreview {
  url: string;
  mime_type: string;
  original_filename: string;
}

export async function verifyDataRoomPin(token: string, pin: string): Promise<DataRoomVerifyResult> {
  const res = await publicApi.post<{ data: DataRoomVerifyResult }>(`/data-room/${token}/verify`, { pin });
  return res.data.data;
}

export async function getDataRoomPreviewUrl(
  token: string,
  documentId: string,
  viewSession: string,
): Promise<DataRoomPreview> {
  const res = await publicApi.get<{ data: DataRoomPreview }>(
    `/data-room/${token}/documents/${documentId}/preview-url`,
    { params: { view_session: viewSession } },
  );
  return res.data.data;
}
