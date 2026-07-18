'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import { GlowButton, StatusBadge, cardGridContainer, cardGridItem } from '@2bready/ui-core';
import { TIER_LABELS, type Tier } from '@/lib/journey-data';
import {
  DOC_STATUS_LABEL,
  levelTotalDocs,
  levelVerifiedDocs,
  toDocStatus,
  type JourneyLevel,
  type JourneyMilestone,
  type JourneyDocument,
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

// Sub-documents render indented under their parent, same relationship staff
// set up in the admin taxonomy editor — not flattened into one plain list.
function DocumentRow({
  doc,
  depth,
  level,
  milestone,
  renderDocAction,
  isLastSibling,
}: {
  doc: JourneyDocument;
  depth: number;
  level: JourneyLevel;
  milestone: JourneyMilestone;
  renderDocAction: RenderDocAction;
  isLastSibling: boolean;
}) {
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
        </Typography>
        {renderDocAction(doc, { level, milestone })}
      </Box>
      {doc.children.map((child, i) => (
        <DocumentRow
          key={child.id}
          doc={child}
          depth={depth + 1}
          level={level}
          milestone={milestone}
          renderDocAction={renderDocAction}
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
  defaultOpen,
}: {
  milestone: JourneyMilestone;
  level: JourneyLevel;
  renderDocAction: RenderDocAction;
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
          transition: 'background-color 0.1s ease',
          '&:hover': { bgcolor: 'var(--2br-overlay-row-hover)' },
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
}: {
  badge: JourneyLevel;
  unlocked: boolean;
  tier: Tier | undefined;
  defaultMilestonesOpen: boolean;
  renderDocAction: RenderDocAction;
}) {
  const totalDocs = levelTotalDocs(badge);
  const verifiedDocs = levelVerifiedDocs(badge);
  const pct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);

  return (
    <Accordion defaultExpanded sx={{ mb: 1.5, borderRadius: '8px !important', '&:before': { display: 'none' } }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box className="flex items-center gap-2 w-full pr-2" sx={{ opacity: unlocked ? 1 : 0.6 }}>
          <Chip label={badge.code} size="small" />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }}>
              {badge.name} · {badge.pathway_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {PILLAR_LABEL[badge.pillar] ?? badge.pillar} · {badge.milestones.length} milestones · {pct}%
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
          <MilestoneRow key={milestone.id} milestone={milestone} level={badge} renderDocAction={renderDocAction} defaultOpen={defaultMilestonesOpen} />
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
}

// One Accordion per level, slim indented rows for milestones/documents —
// same flat, grid-line visual language as the admin-side Journey Templates
// taxonomy editor and per-company Journey tab, so the identical Journey/
// Level/Milestone/Document hierarchy reads the same way everywhere it's
// shown. Responsive by construction (Accordion + flex rows), so there's no
// separate mobile layout to maintain.
export function JourneyTree({ levels, isUnlocked, tierFor, defaultMilestonesOpen = false, renderDocAction = DefaultDocAction }: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show">
      {levels.map((badge) => (
        <Box component={motion.div} key={badge.code} variants={cardGridItem}>
          <LevelAccordion
            badge={badge}
            unlocked={isUnlocked(badge)}
            tier={tierFor?.(badge)}
            defaultMilestonesOpen={defaultMilestonesOpen}
            renderDocAction={renderDocAction}
          />
        </Box>
      ))}
    </Box>
  );
}
