'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { GlowButton, StatusBadge, cardGridContainer, cardGridItem, easeOutExpo } from '@2bready/ui-core';
import { TIER_LABELS, levelDocCount, type BadgeLevel, type Milestone } from '@/lib/journey-data';

// Shared with every hover/interaction transition in this tree so motion
// reads as one system rather than a grab-bag of ad-hoc durations — same
// curve as ui-core's easeOut, expressed as a CSS string since these are
// plain sx transitions, not framer-motion props.
const EASE_CSS = 'cubic-bezier(0.4, 0, 0.2, 1)';

// No verification tracking exists yet (that's Sprint 4/5 backend work), so
// every document is honestly "pending" and every rollup is 0 — but the
// rollup math itself (not-started / in-progress / complete) is real and
// ready for a real `verifiedCount` the moment document status exists.
function rollupStatus(verified: number, total: number): { label: string; bgcolor: string; color: string } {
  if (total > 0 && verified === total) return { label: 'Complete', bgcolor: 'success.light', color: 'success.dark' };
  if (verified > 0) return { label: `${verified}/${total} verified`, bgcolor: 'warning.light', color: 'warning.dark' };
  return { label: `0/${total} verified`, bgcolor: 'action.selected', color: 'text.secondary' };
}

function StatusChip({ verified, total }: { verified: number; total: number }) {
  const status = rollupStatus(verified, total);
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

export type RenderDocAction = (doc: string, ctx: { level: BadgeLevel; milestone: Milestone }) => React.ReactNode;

function DefaultDocAction() {
  return <StatusBadge status="pending" label="Pending" />;
}

function MilestoneNode({
  milestone,
  level,
  unlocked,
  isFirst,
  isLast,
  defaultOpen,
  renderDocAction,
}: {
  milestone: Milestone;
  level: BadgeLevel;
  unlocked: boolean;
  isFirst: boolean;
  isLast: boolean;
  defaultOpen: boolean;
  renderDocAction: RenderDocAction;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const verified = 0; // seed for the real per-document status once it exists

  return (
    <Box sx={{ position: 'relative', pl: 3 }}>
      {/* Branch connector: a rounded elbow curving from the trunk down to the
          milestone dot (border-radius on the corner, not two hard-angled
          boxes) — reads as a drawn line rather than two abutting rectangles.
          The first milestone has no incoming vertical (nothing above it to
          connect to), just its own horizontal tick. */}
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
        <StatusChip verified={verified} total={milestone.docs.length} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: `transform 0.2s ${EASE_CSS}`, transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>

      <Collapse in={open} timeout={220} easing={{ enter: EASE_CSS, exit: EASE_CSS }}>
        <Box sx={{ pl: 2.5, py: 0.5, display: 'flex', flexDirection: 'column' }}>
          {milestone.docs.map((doc, i) => (
            <Box
              key={doc}
              className="flex items-center gap-3"
              sx={{
                py: 1,
                borderBottom: i === milestone.docs.length - 1 ? 'none' : '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {doc}
              </Typography>
              {renderDocAction(doc, { level, milestone })}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function LevelNode({
  badge,
  unlocked,
  isLast,
  defaultMilestonesOpen,
  renderDocAction,
}: {
  badge: BadgeLevel;
  unlocked: boolean;
  isLast: boolean;
  defaultMilestonesOpen: boolean;
  renderDocAction: RenderDocAction;
}) {
  const totalDocs = levelDocCount(badge);
  const verifiedDocs = 0; // seed for the real rollup once document status exists
  const pct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);

  return (
    <Box sx={{ position: 'relative', pl: 6, pb: isLast ? 0 : 5 }}>
      {/* Trunk connector down to the next level node — grows in from the top
          on mount rather than appearing instantly, so the tree reads as
          drawn/constructed once, not a static SVG-less div. */}
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
          success-colored glow ring (same color-mix recipe as GlowButton's
          blue glow, tinted green) so "unlocked" reads as a real state change,
          not just a border-color swap. */}
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
          borderColor: unlocked ? 'success.main' : 'divider',
          bgcolor: 'background.paper',
          zIndex: 1,
          transition: `box-shadow 0.25s ${EASE_CSS}`,
          boxShadow: unlocked
            ? '0 0 0 4px color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent), 0 4px 16px -4px color-mix(in srgb, var(--mui-palette-success-main) 45%, transparent)'
            : 'none',
        }}
      >
        {badge.emoji}
      </Box>

      <Box className="flex items-center gap-2" sx={{ minHeight: 40 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {badge.level} {badge.name} · {badge.pathwayName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {badge.milestones.length} milestones · {totalDocs} documents
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
            ...(unlocked
              ? { bgcolor: 'success.light', color: 'success.dark' }
              : { bgcolor: 'action.selected', color: 'text.secondary' }),
          }}
        >
          {unlocked ? <CheckCircleOutlinedIcon sx={{ fontSize: '0.875rem' }} /> : <LockOutlinedIcon sx={{ fontSize: '0.875rem' }} />}
          {unlocked ? 'UNLOCKED' : TIER_LABELS[badge.tier]}
        </Box>
      </Box>

      {/* Level-wide progress — same bar/percentage language as PillarCard on
          the Overview page, so a level node is informative even collapsed. */}
      <Box sx={{ mt: 1 }}>
        <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
          <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', bgcolor: unlocked ? 'success.main' : 'text.disabled', transition: 'width 0.4s ease' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
          <span>{pct}%</span>
          <span>{verifiedDocs}/{totalDocs} verified</span>
        </Box>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {badge.milestones.map((milestone, i) => (
          <MilestoneNode
            key={milestone.name}
            milestone={milestone}
            level={badge}
            unlocked={unlocked}
            isFirst={i === 0}
            isLast={i === badge.milestones.length - 1}
            defaultOpen={defaultMilestonesOpen}
            renderDocAction={renderDocAction}
          />
        ))}
      </Box>

      {!unlocked && (
        <Box className="flex items-center justify-between gap-3" sx={{ mt: 2, pl: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Upgrade to {TIER_LABELS[badge.tier]} to unlock this level.
          </Typography>
          <GlowButton href="/billing" size="small">
            Upgrade →
          </GlowButton>
        </Box>
      )}
    </Box>
  );
}

export interface JourneyTreeProps {
  levels: BadgeLevel[];
  isUnlocked: (badge: BadgeLevel) => boolean;
  /** Auto-expand every milestone — the Journey page wants collapsed-by-default (browsing), the Documents page wants everything open (acting on documents). */
  defaultMilestonesOpen?: boolean;
  /** What to render after each document's name — defaults to the plain "Pending" badge; the Documents page overrides this with status + real action buttons. */
  renderDocAction?: RenderDocAction;
}

// A vertical growth path — Comply → Scale → Lead, L1 through L4 — rather
// than stacked accordion cards. Each level is a trunk node; its milestones
// branch off to the side and expand individually to reveal documents, so
// the hierarchy (Journey > Level > Milestone > Documents) reads visually,
// not just via nesting/indentation. Shared by the Overview/Journey pages
// (browsing, collapsed) and the Documents page (acting on files, expanded
// with real Upload/Preview/Download actions) via renderDocAction — one tree
// implementation, not a second one per page.
export function JourneyTree({ levels, isUnlocked, defaultMilestonesOpen = false, renderDocAction = DefaultDocAction }: JourneyTreeProps) {
  return (
    <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show" sx={{ pt: 1 }}>
      {levels.map((badge, i) => (
        <Box component={motion.div} key={badge.level} variants={cardGridItem}>
          <LevelNode
            badge={badge}
            unlocked={isUnlocked(badge)}
            isLast={i === levels.length - 1}
            defaultMilestonesOpen={defaultMilestonesOpen}
            renderDocAction={renderDocAction}
          />
        </Box>
      ))}
    </Box>
  );
}
