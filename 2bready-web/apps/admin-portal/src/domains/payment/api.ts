import api from '@/lib/api';
import type { Lead, LeadPayload, Payment } from './types';

// Subscribing/submitting a payment is company-side self-service (client-portal's
// responsibility) — this app only confirms/rejects on 2bReady's behalf below.

export async function listPayments(status?: string, companyId?: string): Promise<Payment[]> {
  const res = await api.get<{ data: Payment[] }>('/payments', {
    params: { status: status || undefined, company_id: companyId || undefined },
  });
  return res.data.data;
}

export async function confirmPayment(id: string): Promise<Payment> {
  const res = await api.post<{ data: Payment }>(`/payments/${id}/confirm`);
  return res.data.data;
}

export async function rejectPayment(id: string): Promise<Payment> {
  const res = await api.post<{ data: Payment }>(`/payments/${id}/reject`);
  return res.data.data;
}

export async function captureLead(data: LeadPayload): Promise<Lead> {
  const res = await api.post<{ data: Lead }>('/leads', data);
  return res.data.data;
}

export async function listLeads(): Promise<Lead[]> {
  const res = await api.get<{ data: Lead[] }>('/leads');
  return res.data.data;
}
