'use client';

import Chip from '@mui/material/Chip';

type StatusKey =
  | 'active' | 'inactive' | 'suspended'
  | 'pending' | 'pending_review'
  | 'approved' | 'paid' | 'published'
  | 'rejected' | 'failed' | 'cancelled'
  | 'expired'
  | 'open' | 'in_progress'
  | 'resolved' | 'closed'
  | 'draft';

const STATUS_MAP: Record<StatusKey, { label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary' }> = {
  active:         { label: 'Active',          color: 'success' },
  approved:       { label: 'Approved',        color: 'success' },
  paid:           { label: 'Paid',            color: 'success' },
  published:      { label: 'Published',       color: 'success' },
  resolved:       { label: 'Resolved',        color: 'success' },
  closed:         { label: 'Closed',          color: 'default' },

  pending:        { label: 'Pending',         color: 'warning' },
  pending_review: { label: 'Pending Review',  color: 'warning' },
  in_progress:    { label: 'In Progress',     color: 'warning' },
  open:           { label: 'Open',            color: 'info' },
  draft:          { label: 'Draft',           color: 'default' },

  rejected:       { label: 'Rejected',        color: 'error' },
  failed:         { label: 'Failed',          color: 'error' },
  suspended:      { label: 'Suspended',       color: 'error' },
  cancelled:      { label: 'Cancelled',       color: 'error' },
  expired:        { label: 'Expired',         color: 'error' },
  inactive:       { label: 'Inactive',        color: 'default' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_MAP[status as StatusKey] ?? { label: status, color: 'default' as const };
  return (
    <Chip
      label={label ?? config.label}
      color={config.color}
      size="small"
      variant="outlined"
    />
  );
}
