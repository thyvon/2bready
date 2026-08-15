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
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import UploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { GlowButton, StatusBadge, LevelMedal, cardGridContainer, cardGridItem, cardRestShadow, cardHoverGlow } from '@2bready/ui-core';
import { TIER_LABELS, type Tier } from '@/lib/journey-data';
import { useTranslation } from '@/lib/i18n';
import {
  DOC_STATUS_LABEL,
  levelTotalDocs,
  levelVerifiedDocs,
  toDocStatus,
  type JourneyLevel,
  type JourneyMilestone,
  type JourneyDocument,
  type DocumentHistoryEntry,
} from '@/lib/journey-api';

const PILLAR_LABEL: Record<string, string> = { comply: 'Comply', scale: 'Scale', lead: 'Lead' };

// A milestone with any real progress (something uploaded, even if still
// under review/rejected — anything past the untouched "pending" state)
// starts expanded, so a returning user sees what needs attention without
// clicking through every milestone to find it.
function milestoneHasUpload(milestone: JourneyMilestone): boolean {
  return milestone.documents.some((doc) => toDocStatus(doc.status) !== 'pending');
}

function rollupStatus(verified: number, total: number): { label: string; color: 'success' | 'warning' | 'default' } {
  if (total > 0 && verified === total) return { label: 'Complete', color: 'success' };
  if (verified > 0) return { label: `${verified}/${total} verified`, color: 'warning' };
  return { label: `0/${total} verified`, color: 'default' };
}

function StatusChip({ verified, total }: { verified: number; total: number }) {
  const status = rollupStatus(verified, total);
  return <Chip label={status.label} size="small" color={status.color} variant="outlined" />;
}

export type RenderDocAction = (doc: JourneyDocument, ctx: { level: JourneyLevel; milestone: JourneyMilestone }) => React.ReactNode;

function DefaultDocAction(doc: JourneyDocument) {
  const status = toDocStatus(doc.status);
  return <StatusBadge status={status} label={DOC_STATUS_LABEL[status]} />;
}

// Same wording pattern as admin-portal's Journey view (which staff use to
// review these same documents) — one consistent recurrence label across
// both apps, not a client-only phrasing.
function useRecurrenceLabel(doc: JourneyDocument): string | null {
  const { t } = useTranslation();

  if (doc.recurrence_type === 'periodic_monthly') return t('journey.recurrence_monthly');
  if (doc.recurrence_type === 'periodic_annual') return t('journey.recurrence_annual');
  if (doc.recurrence_type === 'rolling') return t('journey.recurrence_expires_in', { months: String(doc.expiry_months ?? '') });
  return null;
}

// "Jul 23, 2026" — same shared format admin-portal's Journey view uses, not
// a raw locale-default like "7/23/2026".
function formatHistoryDate(value: string | null): string {
  return value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : '—';
}

// A periodic_monthly period_key is "2026-07" (needs a real Date, not a
// calendar day, since a month has no day-of-month of its own) — "Jul 2026"
// reads better than the raw key. periodic_annual's period_key ("2026") is
// already the label as-is.
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
// guide line, see DocumentRow's own `children` recursion below) — same
// dot-timeline language as admin-portal's Journey view (HistorySubRow),
// so staff and companies read the identical history shape, just themed by
// each app's own palette/glow.
function HistorySubRow({
  entry,
  recurrenceType,
  onPreview,
  onBackfill,
}: {
  entry: DocumentHistoryEntry;
  recurrenceType: JourneyDocument['recurrence_type'];
  onPreview?: () => void;
  /** Only ever passed for a periodic template's real past, non-current gap — rolling has no calendar slot to backfill, and the current period stays the row's own plain Upload button, not this history action. */
  onBackfill?: () => void;
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
        '&:hover': { bgcolor: entry.is_missing ? (theme) => alpha(theme.palette.error.main, 0.08) : 'action.hover' },
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
          {entry.comment && (
            <Typography variant="caption" sx={{ color: entry.status === 'rejected' ? 'error.main' : 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
              <CommentOutlinedIcon sx={{ fontSize: 12 }} />
              {entry.comment}
            </Typography>
          )}
        </Box>
      </Box>
      <Box className="flex items-center gap-1" sx={{ flex: 'none' }}>
        {entry.is_missing ? (
          <>
            <Chip label={t('journey.history_missing_label')} size="small" color="error" variant="outlined" />
            {onBackfill && !entry.is_current && (
              <Typography
                component="button"
                onClick={onBackfill}
                variant="caption"
                className="flex items-center gap-0.5"
                sx={{ cursor: 'pointer', bgcolor: 'transparent', border: 'none', p: 0, ml: 0.5, fontWeight: 600, color: 'primary.main' }}
              >
                <UploadOutlinedIcon sx={{ fontSize: '0.9rem' }} />
                {t('journey.history_backfill_upload')}
              </Typography>
            )}
          </>
        ) : (
          <>
            <StatusBadge status={toDocStatus(entry.status ?? 'pending')} label={DOC_STATUS_LABEL[toDocStatus(entry.status ?? 'pending')]} />
            {entry.id && onPreview && (
              <Tooltip title="Preview">
                <IconButton size="small" onClick={onPreview}>
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
  onBackfill,
}: {
  entries: DocumentHistoryEntry[];
  recurrenceType: JourneyDocument['recurrence_type'];
  onPreview?: (entry: DocumentHistoryEntry) => void;
  onBackfill?: (entry: DocumentHistoryEntry) => void;
}) {
  return (
    <Box sx={{ pl: 2.75, borderLeft: '2px solid', borderColor: 'divider', ml: 0.75 }}>
      {entries.map((entry, i) => (
        <HistorySubRow
          key={entry.id ?? entry.period_key ?? i}
          entry={entry}
          recurrenceType={recurrenceType}
          onPreview={onPreview ? () => onPreview(entry) : undefined}
          onBackfill={onBackfill ? () => onBackfill(entry) : undefined}
        />
      ))}
    </Box>
  );
}

// A monthly document owes 12 periods/year — too many sub-rows to show by
// default. Collapses to a glanceable strip (most recent MONTHLY_STRIP_SIZE
// periods, oldest-to-newest left-to-right) with a gap count, one click from
// the same sub-row list annual uses. Annual/rolling never reach this — 2-4
// entries is small enough to just show (see DocumentHistory below). Same
// idiom as admin-portal's Journey view.
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
// monthly document starts collapsed as MonthlyStrip instead, and its
// expanded list itself only shows the most recent MONTHLY_STRIP_SIZE
// entries until "show earlier months" is clicked.
function DocumentHistory({
  doc,
  onPreview,
  onBackfillUpload,
}: {
  doc: JourneyDocument;
  onPreview?: (entry: DocumentHistoryEntry) => void;
  onBackfillUpload?: (doc: JourneyDocument, entry: DocumentHistoryEntry) => void;
}) {
  const { t } = useTranslation();
  // The current period is already the doc template row's own status/action
  // (StatusBadge + Preview/Upload above) — repeating it here would show the
  // same document twice under one name.
  const pastHistory = doc.history.filter((entry) => !entry.is_current);
  const monthly = doc.recurrence_type === 'periodic_monthly';
  const [expanded, setExpanded] = useState(!monthly);
  const [showAll, setShowAll] = useState(false);

  if (pastHistory.length === 0) return null;

  // Rolling has no calendar slot to backfill into (only "is there a
  // currently-valid upload") — only a periodic template's real past gap
  // gets the backfill action.
  const canBackfill = doc.recurrence_type === 'periodic_monthly' || doc.recurrence_type === 'periodic_annual';
  const onBackfill = onBackfillUpload && canBackfill ? (entry: DocumentHistoryEntry) => onBackfillUpload(doc, entry) : undefined;

  if (monthly && !expanded) {
    return <MonthlyStrip history={pastHistory} onExpand={() => setExpanded(true)} />;
  }

  const visible = monthly && !showAll ? pastHistory.slice(0, MONTHLY_STRIP_SIZE) : pastHistory;
  const remaining = pastHistory.length - visible.length;

  return (
    <Box>
      <HistorySubList entries={visible} recurrenceType={doc.recurrence_type} onPreview={onPreview} onBackfill={onBackfill} />
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

// Sub-documents render indented under their parent, same relationship staff
// set up in the admin taxonomy editor — not flattened into one plain list.
function DocumentRow({
  doc,
  depth,
  level,
  milestone,
  renderDocAction,
  onBackfillUpload,
  onPreviewDocument,
  isLastSibling,
}: {
  doc: JourneyDocument;
  depth: number;
  level: JourneyLevel;
  milestone: JourneyMilestone;
  renderDocAction: RenderDocAction;
  onBackfillUpload?: (doc: JourneyDocument, entry: DocumentHistoryEntry) => void;
  onPreviewDocument?: (documentId: string, title: string) => void;
  isLastSibling: boolean;
}) {
  const recurrenceLabel = useRecurrenceLabel(doc);

  return (
    <Box sx={{ pl: depth * 2.5 }}>
      <Box
        className="flex items-center gap-3"
        sx={{
          py: depth === 0 ? 0.75 : 0.5,
          mx: -1,
          px: 1,
          borderBottom: depth === 0 && isLastSibling && doc.children.length === 0 ? 'none' : '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.1s ease',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        {doc.document_id ? (
          <InsertDriveFileIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
        ) : (
          <InsertDriveFileOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
        )}
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {doc.name}
        </Typography>
        {recurrenceLabel && <Chip label={recurrenceLabel} size="small" variant="outlined" />}
        {renderDocAction(doc, { level, milestone })}
      </Box>
      <DocumentHistory
        doc={doc}
        onPreview={onPreviewDocument ? (entry) => entry.id && onPreviewDocument(entry.id, doc.name) : undefined}
        onBackfillUpload={onBackfillUpload}
      />
      {doc.children.map((child, i) => (
        <DocumentRow
          key={child.id}
          doc={child}
          depth={depth + 1}
          level={level}
          milestone={milestone}
          renderDocAction={renderDocAction}
          onBackfillUpload={onBackfillUpload}
          onPreviewDocument={onPreviewDocument}
          isLastSibling={i === doc.children.length - 1}
        />
      ))}
    </Box>
  );
}

function MilestoneRow({
  milestone,
  level,
  renderDocAction,
  onBackfillUpload,
  onPreviewDocument,
  defaultOpen,
}: {
  milestone: JourneyMilestone;
  level: JourneyLevel;
  renderDocAction: RenderDocAction;
  onBackfillUpload?: (doc: JourneyDocument, entry: DocumentHistoryEntry) => void;
  onPreviewDocument?: (documentId: string, title: string) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || milestoneHasUpload(milestone));
  const verified = milestone.documents.filter((doc) => toDocStatus(doc.status) === 'verified').length;

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        className="flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        sx={{
          cursor: 'pointer',
          userSelect: 'none',
          py: 0.75,
          px: 1,
          mx: -1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          transition: 'background-color 0.1s ease',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          {milestone.name}
        </Typography>
        <StatusChip verified={verified} total={milestone.documents.length} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>

      <Collapse in={open} timeout={180}>
        <Box sx={{ pl: 1, py: 0.5, display: 'flex', flexDirection: 'column' }}>
          {milestone.documents.map((doc, i) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              depth={0}
              level={level}
              milestone={milestone}
              renderDocAction={renderDocAction}
              onBackfillUpload={onBackfillUpload}
              onPreviewDocument={onPreviewDocument}
              isLastSibling={i === milestone.documents.length - 1}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function LevelAccordion({
  badge,
  unlocked,
  tier,
  defaultMilestonesOpen,
  renderDocAction,
  onBackfillUpload,
  onPreviewDocument,
}: {
  badge: JourneyLevel;
  unlocked: boolean;
  tier: Tier | undefined;
  defaultMilestonesOpen: boolean;
  renderDocAction: RenderDocAction;
  onBackfillUpload?: (doc: JourneyDocument, entry: DocumentHistoryEntry) => void;
  onPreviewDocument?: (documentId: string, title: string) => void;
}) {
  const totalDocs = levelTotalDocs(badge);
  const verifiedDocs = levelVerifiedDocs(badge);
  const pct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);

  return (
    // Locked levels start collapsed — reduces the wall of content on first
    // load to just what the company can actually act on right now, without
    // hiding anything (one click reopens it). Search/filter always forces
    // levels open too, so a matching document never hides inside a
    // collapsed locked level.
    <Accordion
      defaultExpanded={unlocked || defaultMilestonesOpen}
      sx={{
        borderRadius: '8px !important',
        // Resting state: quiet neutral elevation (same recipe as PillarCard).
        // Hover: swaps to the GlowButton-style colored ring + blurred glow —
        // matches the app's brand language without every card glowing at once.
        boxShadow: cardRestShadow,
        transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { boxShadow: cardHoverGlow() },
        '&:before': { display: 'none' },
        // MUI's Accordion default zeroes margin on `&.Mui-expanded:last-of-type`
        // (unconditional, not disableGutters-gated) — each card is solo inside
        // its own motion.div wrapper so it always matches :last-of-type,
        // collapsing any margin-based gap the instant it opens. Spacing comes
        // from `gap` on the flex container below instead.
        '&.Mui-expanded': { margin: 0 },
      }}
      disableGutters
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box className="flex items-center gap-2 w-full pr-2" sx={{ opacity: unlocked ? 1 : 0.6 }}>
          <LevelMedal code={badge.code} imageUrl={badge.medal_image_url} />
          <Chip label={badge.code} size="small" />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {badge.name} · {badge.pathway_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {PILLAR_LABEL[badge.pillar] ?? badge.pillar} · {badge.milestones.length} milestones
            </Typography>
          </Box>
          <Chip
            label={unlocked ? 'UNLOCKED' : tier ? TIER_LABELS[tier] : 'LOCKED'}
            size="small"
            icon={unlocked ? <CheckCircleOutlinedIcon /> : <LockOutlinedIcon />}
            color={unlocked ? 'success' : undefined}
            variant={unlocked ? 'filled' : 'outlined'}
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
                bgcolor: unlocked ? 'success.main' : 'text.disabled',
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {verifiedDocs}/{totalDocs} verified
          </Typography>
        </Box>

        {badge.milestones.map((milestone) => (
          <MilestoneRow
            key={milestone.id}
            milestone={milestone}
            level={badge}
            renderDocAction={renderDocAction}
            onBackfillUpload={onBackfillUpload}
            onPreviewDocument={onPreviewDocument}
            defaultOpen={defaultMilestonesOpen}
          />
        ))}

        {!unlocked && tier && (
          <Box className="flex items-center justify-between gap-3" sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upgrade to {TIER_LABELS[tier]} to unlock this level.
            </Typography>
            <GlowButton href="/billing" size="small">
              Upgrade →
            </GlowButton>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export interface JourneyTreeProps {
  levels: JourneyLevel[];
  isUnlocked: (level: JourneyLevel) => boolean;
  /** The subscription tier required for this level, for the locked-state badge/copy — real data from Package.tier via PackageProvider, not a hardcoded lookup. Undefined levels just show no tier badge. */
  tierFor?: (level: JourneyLevel) => Tier | undefined;
  /** Auto-expand every milestone — the Journey page wants collapsed-by-default (browsing), the Documents page wants everything open (acting on documents). */
  defaultMilestonesOpen?: boolean;
  /** What to render after each document's name — defaults to the plain status badge; the Documents page overrides this with real action buttons. */
  renderDocAction?: RenderDocAction;
  /** Called when the user picks a real past gap to file for — only offered on a periodic template's missing, non-current history entry. Omit to leave history read-only (e.g. a page with no upload flow of its own). */
  onBackfillUpload?: (doc: JourneyDocument, entry: DocumentHistoryEntry) => void;
  /** Opens the same preview dialog the main row's action uses, for a past history entry's document id — omitted anywhere history previewing isn't wired up (falls back to no preview icon on history rows). */
  onPreviewDocument?: (documentId: string, title: string) => void;
}

// One Accordion per level, slim indented rows for milestones/documents —
// same flat, grid-line visual language as the admin-side Journey Templates
// taxonomy editor and per-company Journey tab, so the identical Journey/
// Level/Milestone/Document hierarchy reads the same way everywhere it's
// shown. Responsive by construction (Accordion + flex rows), so there's no
// separate mobile layout to maintain.
export function JourneyTree({
  levels,
  isUnlocked,
  tierFor,
  defaultMilestonesOpen = false,
  renderDocAction = DefaultDocAction,
  onBackfillUpload,
  onPreviewDocument,
}: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {levels.map((badge) => (
        <Box component={motion.div} key={badge.code} variants={cardGridItem}>
          <LevelAccordion
            badge={badge}
            unlocked={isUnlocked(badge)}
            tier={tierFor?.(badge)}
            defaultMilestonesOpen={defaultMilestonesOpen}
            renderDocAction={renderDocAction}
            onBackfillUpload={onBackfillUpload}
            onPreviewDocument={onPreviewDocument}
          />
        </Box>
      ))}
    </Box>
  );
}
