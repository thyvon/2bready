import api from '@/lib/api';
import type { Lead, LeadPayload, Payment, PaymentMethod, SubscribeResult, Subscription } from './types';

export async function listSubscriptions(): Promise<Subscription[]> {
  const res = await api.get<{ data: Subscription[] }>('/subscriptions');
  return res.data.data;
}

export async function subscribeToPackage(packageId: string, method: PaymentMethod): Promise<SubscribeResult> {
  const res = await api.post<{ data: SubscribeResult }>('/subscriptions', { package_id: packageId, method });
  return res.data.data;
}

export async function listPayments(status?: string): Promise<Payment[]> {
  const res = await api.get<{ data: Payment[] }>('/payments', { params: status ? { status } : undefined });
  return res.data.data;
}

export async function submitPayment(id: string): Promise<Payment> {
  const res = await api.post<{ data: Payment }>(`/payments/${id}/submit`);
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
