'use client';

import Chip from '@mui/material/Chip';
import type { ReactElement } from 'react';

type StatusKey =
  | 'active' | 'inactive' | 'suspended'
  | 'pending' | 'pending_review' | 'pending_payment' | 'awaiting_confirmation'
  | 'approved' | 'paid' | 'published' | 'confirmed' | 'verified' | 'completed'
  | 'rejected' | 'failed' | 'cancelled'
  | 'expired'
  | 'open' | 'in_progress'
  | 'resolved' | 'closed'
  | 'draft';

const STATUS_COLOR: Record<StatusKey, 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'> = {
  active: 'success',
  approved: 'success',
  paid: 'success',
  published: 'success',
  resolved: 'success',
  confirmed: 'success',
  verified: 'success',
  completed: 'success',
  closed: 'default',

  pending: 'warning',
  pending_review: 'warning',
  pending_payment: 'warning',
  awaiting_confirmation: 'warning',
  in_progress: 'warning',
  open: 'info',
  draft: 'default',

  rejected: 'error',
  failed: 'error',
  suspended: 'error',
  cancelled: 'error',
  expired: 'error',
  inactive: 'default',
};

export interface StatusBadgeProps {
  status: string;
  /** Display text. Ui-core has no i18n of its own — pass the already-resolved label. */
  label?: string;
  /** Optional icon to render before the label. */
  icon?: ReactElement;
}

// Color mapping is the reusable part; text is always supplied by the caller
// so this stays agnostic of whichever app's i18n system is calling it.
export function StatusBadge({ status, label, icon }: StatusBadgeProps) {
  const color = STATUS_COLOR[status as StatusKey] ?? 'default';
  return <Chip icon={icon} label={label ?? status} color={color} size="small" variant="outlined" />;
}
