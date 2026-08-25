'use client';

import { useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';

import type { TrustBadgeReport } from '@/lib/trust-badge-api';
import { useTranslation } from '@/lib/i18n';

export interface VerificationReportDialogProps {
  open: boolean;
  onClose: () => void;
  /** Null while the report is being fetched. */
  report: TrustBadgeReport | null;
  loading: boolean;
  error: string | null;
}

// The owner-concept verification report (MVP 6.3.3.2): a certificate-style
// document — trust header, certified entity, executive summary and the
// per-document verification ledger — with Print/PDF support. Printing uses
// a visibility swap so only the report sheet hits the printer.
export default function VerificationReportDialog({ open, onClose, report, loading, error }: VerificationReportDialogProps) {
  const { t } = useTranslation();

  // Milestone names double as the mockup's "achievements" line.
  const achievements = useMemo(() => {
    if (!report) return [];
    return [...new Set(report.ledger.filter((row) => row.status !== 'Pending' && row.status !== 'Rejected').map((row) => row.milestone))];
  }, [report]);

  const grouped = useMemo(() => {
    if (!report) return [];
    const byMilestone = new Map<string, typeof report.ledger>();
    for (const row of report.ledger) {
      byMilestone.set(row.milestone, [...(byMilestone.get(row.milestone) ?? []), row]);
    }
    return [...byMilestone.entries()];
  }, [report]);

  useEffect(() => {
    if (!open) return;
    const style = document.createElement('style');
    style.id = 'verification-report-print';
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        .print-area, .print-area * { visibility: visible; }
        .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: #fff; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {loading || !report ? (
          <Box className="flex flex-col items-center gap-3 py-16">
            {loading ? <CircularProgress /> : <Typography color="error">{error ?? t('trust_badge.report_load_error')}</Typography>}
          </Box>
        ) : (
          <>
            <Box className="print-area" sx={{ p: { xs: 2.5, md: 4 } }}>
              {/* ── Certificate header ── */}
              <Box sx={{ textAlign: 'center', borderBottom: '2px solid', borderColor: 'warning.main', pb: 2, mb: 3 }}>
                <Typography sx={{ fontSize: '1.75rem' }}>🏛️</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '0.02em' }}>
                  {t('trust_badge.report_cert_title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('trust_badge.report_cert_title_kh')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {report.badge.label}
                </Typography>
              </Box>

              {/* ── Certified entity ── */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}>
                  {t('trust_badge.report_certified_entity')}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{report.company.name}</Typography>
                {report.company.name_kh && (
                  <Typography variant="body1">{report.company.name_kh}</Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('trust_badge.report_sector')}: <strong>{report.company.sector ?? '—'}</strong>
                  {' · '}
                  {t('trust_badge.report_issued')}: <strong>{report.badge.issued_at ? new Date(report.badge.issued_at).toLocaleDateString() : '—'}</strong>
                  {' · '}
                  {t('trust_badge.report_audit_id')}: <strong>{report.audit.id}</strong>
                </Typography>
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ fontWeight: 800 }}
                  label={`${report.badge.level_name} (${report.badge.level})`}
                />
              </Box>

              {/* ── Executive summary + achievements ── */}
              <SectionTitle>{t('trust_badge.report_summary_title')}</SectionTitle>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {report.summary}
              </Typography>
              {report.audit.feedback && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  <strong>{t('trust_badge.report_auditor_note')}:</strong> {report.audit.feedback}
                </Typography>
              )}
              {achievements.length > 0 && (
                <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 3 }}>
                  <strong>{t('trust_badge.report_achievements')}:</strong> {achievements.join(' • ')}
                </Typography>
              )}

              {/* ── Enterprise profile ── */}
              <SectionTitle>{t('trust_badge.report_profile_title')}</SectionTitle>
              <ProfileGrid
                rows={[
                  [t('trust_badge.report_company_en'), report.company.name],
                  [t('trust_badge.report_company_kh'), report.company.name_kh ?? '—'],
                  [t('trust_badge.report_sector'), report.company.sector ?? '—'],
                  [t('trust_badge.report_country'), report.company.country ?? '—'],
                  [t('trust_badge.report_employee_count'), report.company.employee_count != null ? String(report.company.employee_count) : '—'],
                ]}
              />

              {/* ── Verification ledger ── */}
              <SectionTitle>{t('trust_badge.report_ledger_title')}</SectionTitle>
              {grouped.map(([milestone, rows]) => (
                <Box key={milestone} sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
                    {milestone}
                  </Typography>
                  <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { border: '1px solid', borderColor: 'divider', p: 0.75, fontSize: '0.78rem', textAlign: 'left' } }}>
                    <thead>
                      <tr>
                        <th>{t('trust_badge.report_col_document')}</th>
                        <th>{t('common.status')}</th>
                        <th>{t('trust_badge.report_col_method')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.document}>
                          <td>{row.document}</td>
                          <td
                            style={{
                              color: row.status === 'Verified' ? 'var(--mui-palette-success-main)' : row.status === 'Bypassed' ? 'var(--mui-palette-info-main)' : 'var(--mui-palette-warning-main)',
                              fontWeight: 600,
                            }}
                          >
                            {row.status === 'Verified' ? '✅ ' : ''}{row.status}
                          </td>
                          <td>{row.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              ))}

              {/* ── Verifier stamp footer ── */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  {(Array.isArray(report.stamp) ? report.stamp : [report.stamp]).filter(Boolean).map((entry, i) => {
                    const record = entry as Record<string, string>;
                    return (
                      <Typography key={i} variant="caption" sx={{ display: 'block' }}>
                        <strong>{record?.role ?? record?.title ?? ''}:</strong> {record?.name ?? record?.authority ?? ''}
                      </Typography>
                    );
                  })}
                  {report.badge.verify_url && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                      🔐 {report.badge.verify_url}
                    </Typography>
                  )}
                </Box>
                {report.badge.qr_code && (
                  <Box
                    component="img"
                    src={report.badge.qr_code}
                    alt="QR"
                    sx={{ width: 72, height: 72 }}
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ position: 'sticky', bottom: 0, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', px: 3, py: 1.5, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button variant="contained" onClick={() => window.print()}>
                {t('trust_badge.report_print')}
              </Button>
              <Button variant="outlined" onClick={onClose}>
                {t('common.close')}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="subtitle2"
      sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'warning.dark', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5, mb: 1.25, mt: 2.5 }}
    >
      {children}
    </Typography>
  );
}

function ProfileGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2" sx={{ mb: 2 }}>
      {rows.map(([label, value]) => (
        <Box key={label} className="flex justify-between gap-2" sx={{ borderBottom: '1px dashed', borderColor: 'divider', py: 0.5, fontSize: '0.8rem' }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
        </Box>
      ))}
    </Box>
  );
}

