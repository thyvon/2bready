'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import StatusBadge from '@/components/ui/StatusBadge';
import { cardGridContainer, cardGridItem } from '@/lib/motion';
import { cardRestShadow, cardHoverShadowNeutral } from '@/lib/card-elevation';
import { LevelMedal } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { formatDate } from '@/lib/utils';
import type { DocumentHistoryEntry, JourneyDocument, JourneyLevel, JourneyMilestone } from '@/domains/journey/types';

const PILLAR_LABEL: Record<string, string> = { comply: 'Comply', scale: 'Scale', lead: 'Lead' };

function milestoneHasActivity(milestone: JourneyMilestone): boolean {
  return milestone.completed || milestone.documents.some((doc) => doc.status !== 'pending');
}

// Trimmed from admin-portal's JourneyTree: no manual sign-off, no extras
// CRUD — a TP firm only ever reviews documents (verify/reject) at the
// level(s) it's actively hired for, never manages the taxonomy or signs
// milestones off itself. Same tree/row visual structure otherwise, so staff
// and TP see one consistent Journey layout.

type RollupStatus =
  | { kind: 'signed_off' }
  | { kind: 'awaiting_signoff' }
  | { kind: 'complete' }
  | { kind: 'verified_count'; verified: number; total: number };

function rollup(milestone: JourneyMilestone): RollupStatus {
  if (milestone.documents.length === 0) {
    return milestone.completed ? { kind: 'signed_off' } : { kind: 'awaiting_signoff' };
  }
  const total = milestone.documents.length;
  const verified = milestone.documents.filter((doc) => doc.status === 'verified').length;
  if (verified === total) return { kind: 'complete' };
  return { kind: 'verified_count', verified, total };
}

function RollupChip({ milestone }: { milestone: JourneyMilestone }) {
  const { t } = useTranslation();
  const status = rollup(milestone);

  const label =
    status.kind === 'signed_off'
      ? t('journey.milestone_signed_off')
      : status.kind === 'awaiting_signoff'
        ? t('journey.milestone_awaiting_signoff')
        : status.kind === 'complete'
          ? t('journey.milestone_complete')
          : t('journey.milestone_verified_count', { verified: String(status.verified), total: String(status.total) });

  const color = status.kind === 'signed_off' || status.kind === 'complete' ? 'success' : status.kind === 'verified_count' && status.verified > 0 ? 'warning' : 'default';

  return <Chip label={label} size="small" color={color} variant="outlined" />;
}

// Same wording/keys as admin's templates editor and JourneyTree — one
// consistent recurrence label across every app that reviews the taxonomy.
function useRecurrenceLabel(doc: JourneyDocument): string | null {
  const { t } = useTranslation();

  if (doc.recurrence_type === 'periodic_monthly') return t('journey_template.recurrence_kind.periodic_monthly');
  if (doc.recurrence_type === 'periodic_annual') return t('journey_template.recurrence_kind.periodic_annual');
  if (doc.recurrence_type === 'rolling') return t('journey_template.expires_in', { months: String(doc.expiry_months ?? '') });
  return null;
}

function formatHistoryDate(value: string | null): string {
  return value ? formatDate(value) : '—';
}

// A periodic_monthly period_key is "2026-07" (needs a real Date, not a
// calendar day) — "Jul 2026" reads better than the raw key. periodic_annual's
// period_key ("2026") is already the label as-is.
function formatMonthlyPeriodLabel(periodKey: string): string {
  const [year, month] = periodKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

function periodLabel(entry: DocumentHistoryEntry, recurrenceType: JourneyDocument['recurrence_type']): string {
  if (recurrenceType === 'periodic_monthly') return entry.period_key ? formatMonthlyPeriodLabel(entry.period_key) : '';
  if (recurrenceType === 'periodic_annual') return entry.period_key ?? '';
  return formatRollingLabel(entry);
}

// Rolling/one-time has no period_key (no calendar slot), so its own date
// range is the entry's label — "Feb 23, 2026 – Jun 23, 2026" — instead of a
// period name. A one-time doc has no expiry, so without an end date the
// label is just the single date ("Aug 15, 2026"), not a dangling "– —".
function formatRollingLabel(entry: DocumentHistoryEntry): string {
  if (!entry.expires_at) return formatHistoryDate(entry.verified_at ?? entry.created_at);
  return `${formatHistoryDate(entry.verified_at ?? entry.created_at)} – ${formatHistoryDate(entry.expires_at)}`;
}

// A period/window nests exactly like a real sub-document (indent + left
// guide line, see DocumentRow's own `children` recursion below) — one
// nesting language for both, not a separate timeline/table widget.
function HistorySubRow({
  entry,
  recurrenceType,
  onPreview,
}: {
  entry: DocumentHistoryEntry;
  recurrenceType: JourneyDocument['recurrence_type'];
  onPreview?: (entry: DocumentHistoryEntry) => void;
}) {
  const { t } = useTranslation();

  return (
    <Box
      className="flex items-center justify-between gap-2"
      sx={{
        py: 0.65,
        px: 1,
        borderRadius: '0 6px 6px 0',
        bgcolor: entry.is_missing ? (theme) => alpha(theme.palette.error.main, 0.08) : 'transparent',
        '&:hover': { bgcolor: entry.is_missing ? (theme) => alpha(theme.palette.error.main, 0.08) : 'var(--2br-overlay-row-hover)' },
      }}
    >
      <Box className="flex items-center gap-2" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            flex: 'none',
            bgcolor: entry.is_missing ? 'background.paper' : 'success.main',
            boxShadow: (theme) =>
              entry.is_missing ? `0 0 0 2px ${theme.palette.error.main}` : entry.is_current ? `0 0 0 3px ${theme.palette.success.light}` : 'none',
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Box className="flex items-center gap-1.5">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {periodLabel(entry, recurrenceType)}
            </Typography>
            {entry.is_current && <Chip label={t('journey.history_current_label')} size="small" variant="outlined" color="success" />}
          </Box>
          {entry.is_missing ? (
            <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ErrorOutlineIcon sx={{ fontSize: 13 }} />
              {t('journey.history_missing_caption')}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckIcon sx={{ fontSize: 12 }} />
              {formatHistoryDate(entry.verified_at ?? entry.created_at)}
            </Typography>
          )}
        </Box>
      </Box>
      <Box className="flex items-center gap-1" sx={{ flex: 'none' }}>
        {entry.is_missing ? (
          <Chip label={t('journey.history_missing_label')} size="small" color="error" variant="outlined" />
        ) : (
          <>
            <StatusBadge status={entry.status ?? 'pending'} />
            {entry.id && onPreview && (
              <Tooltip title={t('journey.preview')}>
                <IconButton size="small" onClick={() => onPreview(entry)}>
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

function HistorySubList({
  entries,
  recurrenceType,
  onPreview,
}: {
  entries: DocumentHistoryEntry[];
  recurrenceType: JourneyDocument['recurrence_type'];
  onPreview?: (entry: DocumentHistoryEntry) => void;
}) {
  return (
    <Box sx={{ pl: 2.75, borderLeft: '2px solid', borderColor: 'divider', ml: 0.75 }}>
      {entries.map((entry, i) => (
        <HistorySubRow key={entry.id ?? entry.period_key ?? i} entry={entry} recurrenceType={recurrenceType} onPreview={onPreview} />
      ))}
    </Box>
  );
}

// A monthly document owes 12 periods/year — too many sub-rows to show by
// default. Collapses to a glanceable strip (most recent MONTHLY_STRIP_SIZE
// periods, oldest-to-newest left-to-right) with a gap count, one click from
// the same sub-row list annual uses.
const MONTHLY_STRIP_SIZE = 6;

function MonthlyStrip({ history, onExpand }: { history: DocumentHistoryEntry[]; onExpand: () => void }) {
  const { t } = useTranslation();
  const ordered = [...history.slice(0, MONTHLY_STRIP_SIZE)].reverse();
  const gaps = ordered.filter((entry) => entry.is_missing).length;

  return (
    <Box className="flex items-center gap-2" sx={{ pl: 2.75 }}>
      <Box className="flex gap-0.5">
        {ordered.map((entry, i) => (
          <Box
            key={entry.id ?? entry.period_key ?? i}
            title={entry.period_key ?? undefined}
            sx={{
              width: 13,
              height: 13,
              borderRadius: '3px',
              bgcolor: entry.is_missing ? 'error.main' : 'success.main',
              opacity: entry.is_missing ? 0.5 : 0.85,
              ...(entry.is_current && { boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}` }),
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {ordered[0] && formatMonthlyPeriodLabel(ordered[0].period_key ?? '')} → {ordered[ordered.length - 1] && formatMonthlyPeriodLabel(ordered[ordered.length - 1].period_key ?? '')}
        {gaps > 0 && (
          <>
            {' · '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {t('journey.history_gap_count', { count: String(gaps) })}
            </Box>
          </>
        )}
      </Typography>
      <Box
        component="button"
        onClick={onExpand}
        sx={{ cursor: 'pointer', bgcolor: 'transparent', border: 'none', p: 0, color: 'primary.main', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
      >
        {t('journey.history_show_all', { count: String(history.length) })}
        <ChevronRightIcon sx={{ fontSize: 14 }} />
      </Box>
    </Box>
  );
}

// Always open for annual/rolling (2-4 entries reads fine by default); a
// monthly document starts collapsed as MonthlyStrip instead.
function DocumentHistory({ doc, onPreview }: { doc: JourneyDocument; onPreview?: (entry: DocumentHistoryEntry) => void }) {
  const { t } = useTranslation();
  // The current period is already the doc row's own status/action above —
  // repeating it here would show the same document twice under one name.
  const pastHistory = doc.history.filter((entry) => !entry.is_current);
  const monthly = doc.recurrence_type === 'periodic_monthly';
  const [expanded, setExpanded] = useState(!monthly);
  const [showAll, setShowAll] = useState(false);

  if (pastHistory.length === 0) return null;

  if (monthly && !expanded) {
    return <MonthlyStrip history={pastHistory} onExpand={() => setExpanded(true)} />;
  }

  const visible = monthly && !showAll ? pastHistory.slice(0, MONTHLY_STRIP_SIZE) : pastHistory;
  const remaining = pastHistory.length - visible.length;

  return (
    <Box>
      <HistorySubList entries={visible} recurrenceType={doc.recurrence_type} onPreview={onPreview} />
      {remaining > 0 && (
        <Box
          component="button"
          onClick={() => setShowAll(true)}
          sx={{ cursor: 'pointer', bgcolor: 'transparent', border: 'none', p: 0, ml: 4.75, mt: 0.5, color: 'primary.main', fontSize: 11, fontWeight: 600 }}
        >
          {t('journey.history_show_earlier', { count: String(remaining) })}
        </Box>
      )}
    </Box>
  );
}

export type { JourneyDocument };
export type RenderDocAction = (doc: JourneyDocument, ctx: { level: JourneyLevel; milestone: JourneyMilestone }) => React.ReactNode;

function DefaultDocAction(doc: JourneyDocument) {
  return <StatusBadge status={doc.status} />;
}

interface DocumentRowProps {
  doc: JourneyDocument;
  depth: number;
  level: JourneyLevel;
  milestone: JourneyMilestone;
  renderDocAction: RenderDocAction;
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
  isLastSibling: boolean;
}

// Recurses into doc.children, indented — same grouping relationship staff
// set up in the abstract taxonomy editor, kept visible here rather than
// flattened. The "Extra" chip is informational only here (no edit/delete —
// TP has no permission to manage the taxonomy, only to review documents).
function DocumentRow({ doc, depth, level, milestone, renderDocAction, onPreviewDocument, isLastSibling }: DocumentRowProps) {
  const { t } = useTranslation();
  const children = [...doc.children].sort((a, b) => a.id.localeCompare(b.id));
  const isExtra = doc.company_id !== null;
  const recurrenceLabel = useRecurrenceLabel(doc);

  return (
    <Box sx={{ pl: depth * 2.5 }}>
      <Box
        className="flex items-center gap-3"
        sx={{
          py: 0.75,
          mx: -1,
          px: 1,
          borderBottom: depth === 0 && isLastSibling && children.length === 0 ? 'none' : '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.1s ease',
          '&:hover': { bgcolor: 'var(--2br-overlay-row-hover)' },
        }}
      >
        {doc.document_id ? (
          <InsertDriveFileIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
        ) : (
          <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
        )}
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {doc.name}
          {!doc.is_required && ` ${t('journey.optional_suffix')}`}
        </Typography>
        {isExtra && <Chip label={t('journey.extra_chip_label')} size="small" color="info" variant="outlined" />}
        {recurrenceLabel && <Chip label={recurrenceLabel} size="small" variant="outlined" />}
        {renderDocAction(doc, { level, milestone })}
      </Box>
      <DocumentHistory
        doc={doc}
        onPreview={onPreviewDocument ? (entry) => entry.id && onPreviewDocument(entry.id, doc.name, entry.status ?? 'expired') : undefined}
      />
      {children.map((child, i) => (
        <DocumentRow
          key={child.id}
          doc={child}
          depth={depth + 1}
          level={level}
          milestone={milestone}
          renderDocAction={renderDocAction}
          onPreviewDocument={onPreviewDocument}
          isLastSibling={i === children.length - 1}
        />
      ))}
    </Box>
  );
}

interface MilestoneRowProps {
  milestone: JourneyMilestone;
  level: JourneyLevel;
  renderDocAction: RenderDocAction;
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
}

function MilestoneRow({ milestone, level, renderDocAction, onPreviewDocument }: MilestoneRowProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(milestoneHasActivity(milestone));
  const hasDocuments = milestone.documents.length > 0;
  const unlocked = level.unlocked;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        className="flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
          opacity: unlocked ? 1 : 0.6,
          py: 0.75,
          px: 1,
          mx: -1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          transition: 'background-color 0.1s ease',
          '&:hover': { bgcolor: 'var(--2br-overlay-row-hover)' },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          {milestone.name}
        </Typography>
        <RollupChip milestone={milestone} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>

      <Collapse in={open} timeout={180}>
        <Box sx={{ pl: 1, py: 0.5, display: 'flex', flexDirection: 'column' }}>
          {hasDocuments ? (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ pb: 0.5 }}>
                {t('journey.milestone_auto_complete_hint')}
              </Typography>
              {milestone.documents.map((doc, i) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  depth={0}
                  level={level}
                  milestone={milestone}
                  renderDocAction={renderDocAction}
                  onPreviewDocument={onPreviewDocument}
                  isLastSibling={i === milestone.documents.length - 1}
                />
              ))}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 0.5 }}>
              {milestone.completed ? t('journey.milestone_signed_off') : t('journey.milestone_awaiting_signoff')}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

interface LevelAccordionProps {
  level: JourneyLevel;
  renderDocAction: RenderDocAction;
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
}

function LevelAccordion({ level, renderDocAction, onPreviewDocument }: LevelAccordionProps) {
  const { t } = useTranslation();
  const totalMilestones = level.milestones.length;
  const completedMilestones = level.milestones.filter((m) => m.completed).length;
  const pct = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <Accordion
      defaultExpanded
      sx={{
        borderRadius: '8px !important',
        // Monochrome equivalent of client-portal's glow — this app's theme
        // deliberately avoids a colored glow, so hover just deepens the same
        // neutral shadow instead.
        boxShadow: cardRestShadow,
        transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { boxShadow: cardHoverShadowNeutral },
        '&:before': { display: 'none' },
        '&.Mui-expanded': { margin: 0 },
      }}
      disableGutters
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box className="flex items-center gap-2 w-full pr-2" sx={{ opacity: level.unlocked ? 1 : 0.6 }}>
          <LevelMedal code={level.code} imageUrl={level.medal_image_url} />
          <Chip label={level.code} size="small" />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {level.name} · {level.pathway_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {PILLAR_LABEL[level.pillar] ?? level.pillar} · {totalMilestones} {t('journey.milestones_count_suffix')}
            </Typography>
          </Box>
          <Chip
            label={level.unlocked ? t('journey.unlocked').toUpperCase() : t('journey.locked').toUpperCase()}
            size="small"
            icon={level.unlocked ? <CheckCircleOutlinedIcon /> : <LockOutlinedIcon />}
            color={level.unlocked ? 'success' : undefined}
            variant={level.unlocked ? 'filled' : 'outlined'}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mb: 1.5 }}>
          <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: '4px',
                bgcolor: level.unlocked ? 'success.main' : 'text.disabled',
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {t('journey.milestones_complete_count', { completed: String(completedMilestones), total: String(totalMilestones) })}
          </Typography>
        </Box>

        {level.milestones.map((milestone) => (
          <MilestoneRow key={milestone.id} milestone={milestone} level={level} renderDocAction={renderDocAction} onPreviewDocument={onPreviewDocument} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export interface JourneyTreeProps {
  levels: JourneyLevel[];
  /** What to render after each document's name — defaults to the plain status
   * badge; the company review page overrides this with real Verify/Reject/
   * Preview actions. */
  renderDocAction?: RenderDocAction;
  /** Opens the same preview dialog the main row's action uses, for a past
   * history entry's document id — omitted anywhere history previewing isn't
   * wired up (falls back to no preview icon on history rows). */
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
}

// One Accordion per level, slim indented rows for milestones/documents —
// mirrors admin-portal's JourneyTree visual structure exactly, trimmed of
// admin/staff-only abilities (manual milestone sign-off, extra-requirement
// CRUD) a TP account never has.
export function JourneyTree({ levels, renderDocAction = DefaultDocAction, onPreviewDocument }: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {levels.map((level) => (
        <Box component={motion.div} key={level.id} variants={cardGridItem}>
          <LevelAccordion level={level} renderDocAction={renderDocAction} onPreviewDocument={onPreviewDocument} />
        </Box>
      ))}
    </Box>
  );
}
