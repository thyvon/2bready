'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

import StatusBadge from '@/components/ui/StatusBadge';
import { cardGridContainer, cardGridItem, easeOutExpo } from '@/lib/motion';
import type { JourneyLevel, JourneyMilestone } from '@/domains/journey/types';

// Same "modern SaaS" easing as every other transition in this app — see
// lib/motion.ts — expressed as a CSS string here since these are plain sx
// transitions, not framer-motion props.
const EASE_CSS = 'cubic-bezier(0.4, 0, 0.2, 1)';

const LEVEL_EMOJI: Record<string, string> = { L1: '🔶', L2: '🥈', L3: '🥇', L4: '💎' };
const PILLAR_LABEL: Record<string, string> = { comply: 'Comply', scale: 'Scale', lead: 'Lead' };

function milestoneHasActivity(milestone: JourneyMilestone): boolean {
  return milestone.completed || milestone.documents.some((doc) => doc.status !== 'pending');
}

function rollup(milestone: JourneyMilestone): { label: string; bgcolor: string; color: string } {
  if (milestone.documents.length === 0) {
    return milestone.completed
      ? { label: 'Signed off', bgcolor: 'success.light', color: 'success.dark' }
      : { label: 'Awaiting sign-off', bgcolor: 'action.selected', color: 'text.secondary' };
  }
  const total = milestone.documents.length;
  const verified = milestone.documents.filter((doc) => doc.status === 'verified').length;
  if (verified === total) return { label: 'Complete', bgcolor: 'success.light', color: 'success.dark' };
  if (verified > 0) return { label: `${verified}/${total} verified`, bgcolor: 'warning.light', color: 'warning.dark' };
  return { label: `0/${total} verified`, bgcolor: 'action.selected', color: 'text.secondary' };
}

function RollupChip({ milestone }: { milestone: JourneyMilestone }) {
  const status = rollup(milestone);
  return (
    <Box
      sx={{
        fontSize: '0.6875rem',
        fontWeight: 600,
        px: 1.125,
        py: 0.25,
        borderRadius: '9999px',
        flexShrink: 0,
        bgcolor: status.bgcolor,
        color: status.color,
      }}
    >
      {status.label}
    </Box>
  );
}

export type JourneyDocument = JourneyMilestone['documents'][number];
export type RenderDocAction = (doc: JourneyDocument, ctx: { level: JourneyLevel; milestone: JourneyMilestone }) => React.ReactNode;

function DefaultDocAction(doc: JourneyDocument) {
  return <StatusBadge status={doc.status} />;
}

interface MilestoneNodeProps {
  milestone: JourneyMilestone;
  level: JourneyLevel;
  isFirst: boolean;
  isLast: boolean;
  onSignOff: (milestoneId: string) => void;
  signingOffId: string | null;
  renderDocAction: RenderDocAction;
}

function MilestoneNode({ milestone, level, isFirst, isLast, onSignOff, signingOffId, renderDocAction }: MilestoneNodeProps) {
  const [open, setOpen] = useState(milestoneHasActivity(milestone));
  const hasDocuments = milestone.documents.length > 0;
  const unlocked = level.unlocked;

  return (
    <Box sx={{ position: 'relative', pl: 3 }}>
      {/* Branch connector: a rounded elbow curving from the trunk down to the
          milestone dot — reads as a drawn line, not two abutting boxes. The
          first milestone has no incoming vertical, just its own tick. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: isFirst ? 14 : -6,
          width: 16,
          height: isFirst ? '2px' : 20,
          ...(isFirst
            ? { bgcolor: 'divider' }
            : { borderLeft: '2px solid', borderBottom: '2px solid', borderColor: 'divider', borderBottomLeftRadius: '8px' }),
        }}
      />
      {!isLast && <Box sx={{ position: 'absolute', left: 0, top: 14, bottom: -20, width: '2px', bgcolor: 'divider' }} />}

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
          borderRadius: '6px',
          transition: `background-color 0.15s ${EASE_CSS}, transform 0.15s ${EASE_CSS}`,
          '&:hover': { bgcolor: 'action.hover', transform: 'translateX(2px)' },
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.primary', flexShrink: 0 }} />
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          {milestone.name}
        </Typography>
        <RollupChip milestone={milestone} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: `transform 0.2s ${EASE_CSS}`, transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>

      <Collapse in={open} timeout={220} easing={{ enter: EASE_CSS, exit: EASE_CSS }}>
        <Box sx={{ pl: 2.5, py: 0.5, display: 'flex', flexDirection: 'column' }}>
          {hasDocuments ? (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ pb: 0.5 }}>
                Completes automatically once every required document is verified.
              </Typography>
              {milestone.documents.map((doc, i) => (
                <Box
                  key={doc.id}
                  className="flex items-center gap-3"
                  sx={{ py: 1, borderBottom: i === milestone.documents.length - 1 ? 'none' : '1px solid', borderColor: 'divider' }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                    {doc.name}
                    {!doc.is_required && ' (optional)'}
                  </Typography>
                  {renderDocAction(doc, { level, milestone })}
                </Box>
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
        </Box>
      </Collapse>
    </Box>
  );
}

interface LevelNodeProps {
  level: JourneyLevel;
  isLast: boolean;
  onSignOff: (milestoneId: string) => void;
  signingOffId: string | null;
  renderDocAction: RenderDocAction;
}

function LevelNode({ level, isLast, onSignOff, signingOffId, renderDocAction }: LevelNodeProps) {
  const totalMilestones = level.milestones.length;
  const completedMilestones = level.milestones.filter((m) => m.completed).length;
  const pct = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);
  const emoji = LEVEL_EMOJI[level.code] ?? '🏁';

  return (
    <Box sx={{ position: 'relative', pl: 6, pb: isLast ? 0 : 5 }}>
      {/* Trunk connector down to the next level node — grows in from the top
          on mount so the tree reads as drawn/constructed, not a static div. */}
      {!isLast && (
        <Box
          component={motion.div}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ ...easeOutExpo, delay: 0.15 }}
          sx={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: '2px', bgcolor: 'divider', transformOrigin: 'top' }}
        />
      )}

      {/* Level node circle, sitting on the trunk — unlocked levels get a soft
          success-colored glow ring so "unlocked" reads as a real state
          change, not just a border-color swap. */}
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 40,
          height: 40,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          border: '2px solid',
          borderColor: level.unlocked ? 'success.main' : 'divider',
          bgcolor: 'background.paper',
          zIndex: 1,
          transition: `box-shadow 0.25s ${EASE_CSS}`,
          boxShadow: level.unlocked
            ? '0 0 0 4px color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent), 0 4px 16px -4px color-mix(in srgb, var(--mui-palette-success-main) 45%, transparent)'
            : 'none',
        }}
      >
        {emoji}
      </Box>

      <Box className="flex items-center gap-2" sx={{ minHeight: 40 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {level.code} · {level.name} · {level.pathway_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {PILLAR_LABEL[level.pillar] ?? level.pillar} · {totalMilestones} milestones
          </Typography>
        </Box>
        <Box
          className="flex items-center gap-1"
          sx={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            px: 1.25,
            py: 0.375,
            borderRadius: '9999px',
            flexShrink: 0,
            ...(level.unlocked
              ? { bgcolor: 'success.light', color: 'success.dark' }
              : { bgcolor: 'action.selected', color: 'text.secondary' }),
          }}
        >
          {level.unlocked ? <CheckCircleOutlinedIcon sx={{ fontSize: '0.875rem' }} /> : <LockOutlinedIcon sx={{ fontSize: '0.875rem' }} />}
          {level.unlocked ? 'UNLOCKED' : 'LOCKED'}
        </Box>
      </Box>

      <Box sx={{ mt: 1 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
          <span>{pct}%</span>
          <span>{completedMilestones}/{totalMilestones} milestones complete</span>
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {level.milestones.map((milestone, i) => (
          <MilestoneNode
            key={milestone.id}
            milestone={milestone}
            level={level}
            isFirst={i === 0}
            isLast={i === level.milestones.length - 1}
            onSignOff={onSignOff}
            signingOffId={signingOffId}
            renderDocAction={renderDocAction}
          />
        ))}
      </Box>
    </Box>
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
}

// A vertical growth path — Comply → Scale → Lead, L1 through L4 — rather than
// stacked accordion cards, matching client-portal's JourneyTree visual
// language so the same underlying Journey/Level/Milestone/Document hierarchy
// reads the same way to both a company and the staff reviewing it. Documents
// are acted on right here (via renderDocAction) rather than linking out to a
// separate Documents tab — same merge client-portal already made, for the
// same reason: it's one tree over one set of data, not two pages. A
// milestone with no documents at all falls back to a manual sign-off
// checkbox — see MilestoneNode.
export function JourneyTree({ levels, onSignOff, signingOffId, renderDocAction = DefaultDocAction }: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show" sx={{ pt: 1 }}>
      {levels.map((level, i) => (
        <Box component={motion.div} key={level.id} variants={cardGridItem}>
          <LevelNode
            level={level}
            isLast={i === levels.length - 1}
            onSignOff={onSignOff}
            signingOffId={signingOffId}
            renderDocAction={renderDocAction}
          />
        </Box>
      ))}
    </Box>
  );
}
