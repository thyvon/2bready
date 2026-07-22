import api from '@/lib/api';
import type { components } from '@2bready/api-client';

// The backend's `status` field comes from a computed enum (`->value`) that
// Scramble can't statically narrow past `string` — the real value set is
// exactly these three (see DataRoomLink::status()), so it's safe to trust
// here the same way document-api.ts trusts a couple of fields the generator
// can't fully type.
export type DataRoomLinkStatus = 'active' | 'expired' | 'revoked';

type DataRoomLinkResource = components['schemas']['DataRoomLinkResource'];

export interface DataRoomLink {
  token: string;
  url: string;
  expires_at: string | null;
  status: DataRoomLinkStatus;
}

export interface DataRoomLinkWithPin extends DataRoomLink {
  /** Only ever present on the create response — never returned again. */
  pin: string;
}

function mapLink(resource: DataRoomLinkResource): DataRoomLink {
  return {
    token: resource.token,
    url: resource.url,
    expires_at: resource.expires_at,
    status: resource.status as DataRoomLinkStatus,
  };
}

export async function getMyDataRoomLink(): Promise<DataRoomLink | null> {
  const res = await api.get<{ data: DataRoomLinkResource | null }>('/data-room');
  return res.data.data ? mapLink(res.data.data) : null;
}

export async function createDataRoomLink(): Promise<DataRoomLinkWithPin> {
  const res = await api.post<{ data: DataRoomLinkResource }>('/data-room');
  const resource = res.data.data;

  // `pin` is only present in this one response (see DataRoomLinkResource's
  // own docblock) — a missing value here would mean the backend contract
  // changed underneath this call, not a state this frontend should paper
  // over silently.
  if (!resource.pin) throw new Error('Data room link created without a PIN.');

  return { ...mapLink(resource), pin: resource.pin };
}

export async function revokeDataRoomLink(): Promise<DataRoomLink> {
  const res = await api.delete<{ data: DataRoomLinkResource }>('/data-room');
  return mapLink(res.data.data);
}
