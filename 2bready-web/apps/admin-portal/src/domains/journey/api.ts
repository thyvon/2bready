import api from '@/lib/api';
import type { Journey } from './types';

export async function getCompanyJourney(companyId: string): Promise<Journey> {
  const res = await api.get<{ data: Journey }>(`/journey/companies/${companyId}`);
  return res.data.data;
}

export async function completeMilestone(companyId: string, milestoneId: string): Promise<void> {
  await api.post(`/journey/companies/${companyId}/milestones/${milestoneId}/complete`);
}
