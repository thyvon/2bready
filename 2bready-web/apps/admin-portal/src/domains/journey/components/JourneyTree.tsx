'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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

function rollup(milestone: JourneyMilestone): { label: string; color: 'success' | 'warning' | 'default' } {
  if (milestone.documents.length === 0) {
    return milestone.completed ? { label: 'Signed off', color: 'success' } : { label: 'Awaiting sign-off', color: 'default' };
  }
  const total = milestone.documents.length;
  const verified = milestone.documents.filter((doc) => doc.status === 'verified').length;
  if (verified === total) return { label: 'Complete', color: 'success' };
  if (verified > 0) return { label: `${verified}/${total} verified`, color: 'warning' };
  return { label: `0/${total} verified`, color: 'default' };
}

function RollupChip({ milestone }: { milestone: JourneyMilestone }) {
  const status = rollup(milestone);
  return <Chip label={status.label} size="small" color={status.color} variant="outlined" />;
}

// Same wording/keys as the templates editor's DocumentTemplateTree.tsx —
// staff should see one consistent recurrence label whether they're editing
// the shared taxonomy or reviewing one company's real documents against it.
function useRecurrenceLabel(doc: JourneyDocument): string | null {
  const { t } = useTranslation();

  if (doc.recurrence_type === 'periodic_monthly') return t('journey_template.recurrence_kind.periodic_monthly');
  if (doc.recurrence_type === 'periodic_annual') return t('journey_template.recurrence_kind.periodic_annual');
  if (doc.recurrence_type === 'rolling') return t('journey_template.expires_in', { months: String(doc.expiry_months ?? '') });
  return null;
}

// Same shared formatter the rest of admin-portal already uses (users/audit
// log/payments pages) — "Jul 23, 2026", not a raw locale-default like
// "7/23/2026".
function formatHistoryDate(value: string | null): string {
  return value ? formatDate(value) : '—';
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
              <Tooltip title="Preview">
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
// the same sub-row list annual uses. Annual/rolling never reach this —
// 2-4 entries is small enough to just show (see DocumentHistory below).
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
// entries until "show earlier months" is clicked — 12+ sub-rows at once
// would bury the checklist row it belongs to.
function DocumentHistory({ doc, onPreview }: { doc: JourneyDocument; onPreview?: (entry: DocumentHistoryEntry) => void }) {
  const { t } = useTranslation();
  // The current period is already the doc template row's own status/action
  // (StatusBadge + Preview/Upload above) — repeating it here would show the
  // same document twice under one name.
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

export interface ExtraRequirementActions {
  onAddExtra: (milestoneId: string, parentDocumentId: string | null) => void;
  onEditExtra: (doc: JourneyDocument) => void;
  onDeleteExtra: (doc: JourneyDocument) => void;
}

function DefaultDocAction(doc: JourneyDocument) {
  return <StatusBadge status={doc.status} />;
}

interface DocumentRowProps {
  doc: JourneyDocument;
  depth: number;
  level: JourneyLevel;
  milestone: JourneyMilestone;
  renderDocAction: RenderDocAction;
  extras?: ExtraRequirementActions;
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
  isLastSibling: boolean;
}

// Recurses into doc.children, indented — same grouping relationship staff
// set up in the abstract taxonomy editor, kept visible here rather than
// flattened. Edit/delete only render for this company's own extras
// (company_id set): a global node's identity here means "shared taxonomy,"
// only editable from the abstract editor, not this per-company view.
function DocumentRow({ doc, depth, level, milestone, renderDocAction, extras, onPreviewDocument, isLastSibling }: DocumentRowProps) {
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
          {!doc.is_required && ' (optional)'}
        </Typography>
        {isExtra && <Chip label="Extra" size="small" color="info" variant="outlined" />}
        {recurrenceLabel && <Chip label={recurrenceLabel} size="small" variant="outlined" />}
        {extras && (
          <IconButton size="small" onClick={() => extras.onAddExtra(milestone.id, doc.id)} aria-label="Add extra sub-requirement">
            <AddIcon fontSize="small" />
          </IconButton>
        )}
        {extras && isExtra && (
          <>
            <IconButton size="small" onClick={() => extras.onEditExtra(doc)} aria-label="Edit">
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => extras.onDeleteExtra(doc)} aria-label="Delete">
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </>
        )}
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
          extras={extras}
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
  onSignOff: (milestoneId: string) => void;
  signingOffId: string | null;
  renderDocAction: RenderDocAction;
  extras?: ExtraRequirementActions;
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
}

function MilestoneRow({ milestone, level, onSignOff, signingOffId, renderDocAction, extras, onPreviewDocument }: MilestoneRowProps) {
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
                Completes automatically once every required document is verified.
              </Typography>
              {milestone.documents.map((doc, i) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  depth={0}
                  level={level}
                  milestone={milestone}
                  renderDocAction={renderDocAction}
                  extras={extras}
                  onPreviewDocument={onPreviewDocument}
                  isLastSibling={i === milestone.documents.length - 1}
                />
              ))}
            </>
          ) : (
            <Box className="flex items-center gap-1.5" sx={{ py: 0.5 }}>
              <Checkbox
                checked={milestone.completed}
                disabled={!unlocked || milestone.completed || signingOffId === milestone.id}
                onChange={() => onSignOff(milestone.id)}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Mark as signed off
              </Typography>
            </Box>
          )}
          {extras && (
            <Box
              className="flex items-center gap-1 cursor-pointer"
              sx={{ pt: 0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
              onClick={() => extras.onAddExtra(milestone.id, null)}
            >
              <AddIcon fontSize="small" />
              <Typography variant="body2">Add extra requirement</Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

interface LevelAccordionProps {
  level: JourneyLevel;
  onSignOff: (milestoneId: string) => void;
  signingOffId: string | null;
  renderDocAction: RenderDocAction;
  extras?: ExtraRequirementActions;
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
}

function LevelAccordion({ level, onSignOff, signingOffId, renderDocAction, extras, onPreviewDocument }: LevelAccordionProps) {
  const totalMilestones = level.milestones.length;
  const completedMilestones = level.milestones.filter((m) => m.completed).length;
  const pct = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <Accordion
      defaultExpanded
      sx={{
        borderRadius: '8px !important',
        // Monochrome equivalent of client-portal's glow — this app's theme
        // deliberately avoids a colored glow (see MuiButton override), so
        // hover just deepens the same neutral shadow instead.
        boxShadow: cardRestShadow,
        transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': { boxShadow: cardHoverShadowNeutral },
        '&:before': { display: 'none' },
        // MUI's own Accordion default has an unconditional (not disableGutters-
        // gated) `&.Mui-expanded:last-of-type { marginBottom: 0 }` rule. Since
        // each Accordion is solo inside its own motion.div wrapper, it always
        // matches :last-of-type, so any margin-based gap collapses to 0 the
        // moment a card opens. Spacing between cards is handled by `gap` on
        // the flex container instead (see JourneyTree below) — no margin here.
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
              {PILLAR_LABEL[level.pillar] ?? level.pillar} · {totalMilestones} milestones
            </Typography>
          </Box>
          <Chip
            label={level.unlocked ? 'UNLOCKED' : 'LOCKED'}
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
            {completedMilestones}/{totalMilestones} milestones complete
          </Typography>
        </Box>

        {level.milestones.map((milestone) => (
          <MilestoneRow
            key={milestone.id}
            milestone={milestone}
            level={level}
            onSignOff={onSignOff}
            signingOffId={signingOffId}
            renderDocAction={renderDocAction}
            extras={extras}
            onPreviewDocument={onPreviewDocument}
          />
        ))}
      </AccordionDetails>
    </Accordion>
  );
}

export interface JourneyTreeProps {
  levels: JourneyLevel[];
  onSignOff: (milestoneId: string) => void;
  signingOffId: string | null;
  /** What to render after each document's name — defaults to the plain status
   * badge; the Journey page overrides this with real Verify/Reject/Preview
   * actions, since documents live here now rather than a separate tab. */
  renderDocAction?: RenderDocAction;
  /** Add/edit/delete for this company's own extra requirements — omitted
   * anywhere this tree is read-only (or shown to a company_owner/member, who
   * never manage extras themselves; they're "added by 2bReady"). */
  extras?: ExtraRequirementActions;
  /** Opens the same preview dialog the main row's action uses, for a past
   * history entry's document id — omitted anywhere history previewing isn't
   * wired up (falls back to no preview icon on history rows). */
  onPreviewDocument?: (documentId: string, title: string, status: string) => void;
}

// One Accordion per level, slim indented rows for milestones/documents —
// same flat, grid-line visual language as the Journey Templates taxonomy
// editor (journey-templates/[id]/page.tsx), so staff see one consistent
// tree style whether they're editing the shared taxonomy or reviewing one
// company's progress against it. Documents are acted on right here (via
// renderDocAction) rather than linking out to a separate Documents tab. A
// milestone with no documents at all falls back to a manual sign-off
// checkbox — see MilestoneRow.
export function JourneyTree({ levels, onSignOff, signingOffId, renderDocAction = DefaultDocAction, extras, onPreviewDocument }: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {levels.map((level) => (
        <Box component={motion.div} key={level.id} variants={cardGridItem}>
          <LevelAccordion
            level={level}
            onSignOff={onSignOff}
            signingOffId={signingOffId}
            renderDocAction={renderDocAction}
            extras={extras}
            onPreviewDocument={onPreviewDocument}
          />
        </Box>
      ))}
    </Box>
  );
}
