'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';

import StatusBadge from '@/components/ui/StatusBadge';
import { cardGridContainer, cardGridItem } from '@/lib/motion';
import type { JourneyDocument, JourneyLevel, JourneyMilestone } from '@/domains/journey/types';

const PILLAR_LABEL: Record<string, string> = { comply: 'Comply', scale: 'Scale', lead: 'Lead' };

// L1-L4 map to Bronze/Silver/Gold/Platinum in the real taxonomy — a colored
// medal reads faster than the plain code chip alone at a glance.
const LEVEL_MEDAL_COLOR: Record<string, string> = { L1: '#CD7F32', L2: '#9CA3AF', L3: '#D4AF37', L4: '#60A5FA' };

function LevelMedal({ code }: { code: string }) {
  const color = LEVEL_MEDAL_COLOR[code] ?? '#9CA3AF';
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        bgcolor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <MilitaryTechIcon sx={{ color: 'white', fontSize: 20 }} />
    </Box>
  );
}

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
  isLastSibling: boolean;
}

// Recurses into doc.children, indented — same grouping relationship staff
// set up in the abstract taxonomy editor, kept visible here rather than
// flattened. Edit/delete only render for this company's own extras
// (company_id set): a global node's identity here means "shared taxonomy,"
// only editable from the abstract editor, not this per-company view.
function DocumentRow({ doc, depth, level, milestone, renderDocAction, extras, isLastSibling }: DocumentRowProps) {
  const children = [...doc.children].sort((a, b) => a.id.localeCompare(b.id));
  const isExtra = doc.company_id !== null;

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
      {children.map((child, i) => (
        <DocumentRow
          key={child.id}
          doc={child}
          depth={depth + 1}
          level={level}
          milestone={milestone}
          renderDocAction={renderDocAction}
          extras={extras}
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
}

function MilestoneRow({ milestone, level, onSignOff, signingOffId, renderDocAction, extras }: MilestoneRowProps) {
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
}

function LevelAccordion({ level, onSignOff, signingOffId, renderDocAction, extras }: LevelAccordionProps) {
  const totalMilestones = level.milestones.length;
  const completedMilestones = level.milestones.filter((m) => m.completed).length;
  const pct = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <Accordion defaultExpanded sx={{ mb: 1.5, borderRadius: '8px !important', '&:before': { display: 'none' } }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box className="flex items-center gap-2 w-full pr-2" sx={{ opacity: level.unlocked ? 1 : 0.6 }}>
          <LevelMedal code={level.code} />
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
}

// One Accordion per level, slim indented rows for milestones/documents —
// same flat, grid-line visual language as the Journey Templates taxonomy
// editor (journey-templates/[id]/page.tsx), so staff see one consistent
// tree style whether they're editing the shared taxonomy or reviewing one
// company's progress against it. Documents are acted on right here (via
// renderDocAction) rather than linking out to a separate Documents tab. A
// milestone with no documents at all falls back to a manual sign-off
// checkbox — see MilestoneRow.
export function JourneyTree({ levels, onSignOff, signingOffId, renderDocAction = DefaultDocAction, extras }: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show">
      {levels.map((level) => (
        <Box component={motion.div} key={level.id} variants={cardGridItem}>
          <LevelAccordion
            level={level}
            onSignOff={onSignOff}
            signingOffId={signingOffId}
            renderDocAction={renderDocAction}
            extras={extras}
          />
        </Box>
      ))}
    </Box>
  );
}
