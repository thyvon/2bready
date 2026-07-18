'use client';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import type { AuditLog } from '../types';

interface AuditLogDetailsDialogProps {
  log: AuditLog | null;
  onClose: () => void;
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export default function AuditLogDetailsDialog({ log, onClose }: AuditLogDetailsDialogProps) {
  const { t } = useTranslation();

  if (!log) return null;

  // Union of both sides' keys — a create has only `new`, a delete only `old`,
  // an update has both, and they don't always cover the same fields.
  const fieldNames = Array.from(
    new Set([...Object.keys(log.changes?.old ?? {}), ...Object.keys(log.changes?.new ?? {})]),
  );

  return (
    <Dialog open={!!log} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {log.action}
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('audit_log.actor')}: {log.actor_email ?? t('audit_log.system')}
          </Typography>
          {log.auditable_type && (
            <Typography variant="body2" color="text.secondary">
              {t('audit_log.target')}: {log.auditable_type.split('\\').pop()} / {log.auditable_id}
            </Typography>
          )}
          {log.ip_address && (
            <Typography variant="body2" color="text.secondary">
              {t('audit_log.ip_address')}: {log.ip_address}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {t('audit_log.time')}: {formatDate(log.created_at)}
          </Typography>
        </Box>

        {fieldNames.length > 0 && (
          <>
            <Divider sx={{ mb: 1.5 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('audit_log.field')}</TableCell>
                  <TableCell>{t('audit_log.before')}</TableCell>
                  <TableCell>{t('audit_log.after')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fieldNames.map((field) => (
                  <TableRow key={field}>
                    <TableCell sx={{ fontWeight: 500 }}>{field}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                      {stringify(log.changes?.old?.[field])}
                    </TableCell>
                    <TableCell sx={{ wordBreak: 'break-word' }}>{stringify(log.changes?.new?.[field])}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              {t('audit_log.metadata')}
            </Typography>
            {Object.entries(log.metadata).map(([key, value]) => (
              <Typography key={key} variant="body2" color="text.secondary">
                {key}: {stringify(value)}
              </Typography>
            ))}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
