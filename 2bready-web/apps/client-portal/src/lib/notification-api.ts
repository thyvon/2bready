import api from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    message: string;
    action_url?: string;
  };
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
    unread_count: number;
  };
}

export interface NotificationPreference {
  type: string;
  label: string;
  email_enabled: boolean;
  database_enabled: boolean;
}

export async function listNotifications(page = 1, perPage = 15): Promise<NotificationsResponse> {
  const res = await api.get<NotificationsResponse>('/notifications', {
    params: { page, per_page: perPage },
  });
  return res.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post('/notifications/read-all');
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  const res = await api.get<{ data: NotificationPreference[] }>('/notification-preferences');
  return res.data.data;
}

export async function updateNotificationPreferences(
  preferences: Array<{ type: string; email_enabled: boolean; database_enabled: boolean }>,
): Promise<NotificationPreference[]> {
  const res = await api.put<{ data: NotificationPreference[] }>('/notification-preferences', {
    preferences,
  });
  return res.data.data;
}
