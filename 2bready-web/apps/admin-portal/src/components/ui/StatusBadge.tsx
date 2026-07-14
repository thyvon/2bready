'use client';

import Chip from '@mui/material/Chip';
import { useTranslation } from '@/lib/i18n';

type StatusKey =
  | 'active' | 'inactive' | 'suspended'
  | 'pending' | 'pending_review' | 'awaiting_confirmation'
  | 'approved' | 'paid' | 'published' | 'confirmed'
  | 'rejected' | 'failed' | 'cancelled'
  | 'expired'
  | 'open' | 'in_progress'
  | 'resolved' | 'closed'
  | 'draft'
  | 'pending_scan' | 'scan_failed' | 'review' | 'verified';

const STATUS_COLOR: Record<StatusKey, 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'> = {
  active: 'success',
  approved: 'success',
  paid: 'success',
  published: 'success',
  resolved: 'success',
  confirmed: 'success',
  verified: 'success',
  closed: 'default',

  pending: 'warning',
  pending_review: 'warning',
  awaiting_confirmation: 'warning',
  in_progress: 'warning',
  pending_scan: 'warning',
  review: 'warning',
  open: 'info',
  draft: 'default',

  rejected: 'error',
  failed: 'error',
  suspended: 'error',
  cancelled: 'error',
  expired: 'error',
  scan_failed: 'error',
  inactive: 'default',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useTranslation();
  const key = status as StatusKey;
  const color = STATUS_COLOR[key] ?? 'default';
  const resolvedLabel = label ?? (STATUS_COLOR[key] ? t(`status.${key}`) : status);

  return (
    <Chip
      label={resolvedLabel}
      color={color}
      size="small"
      variant="outlined"
    />
  );
}
