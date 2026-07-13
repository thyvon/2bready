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
import { TIER_LABELS, type Tier } from '@/lib/journey-data';
import {
  LEVEL_EMOJI,
  DOC_STATUS_LABEL,
  levelTotalDocs,
  levelVerifiedDocs,
  toDocStatus,
  type JourneyLevel,
  type JourneyMilestone,
  type JourneyDocument,
} from '@/lib/journey-api';

// Shared with every hover/interaction transition in this tree so motion
// reads as one system rather than a grab-bag of ad-hoc durations — same
// curve as ui-core's easeOut, expressed as a CSS string since these are
// plain sx transitions, not framer-motion props.
const EASE_CSS = 'cubic-bezier(0.4, 0, 0.2, 1)';

// A milestone with any real progress (something uploaded, even if still
// under review/rejected — anything past the untouched "pending" state)
// starts expanded, so a returning user sees what needs attention without
// clicking through every milestone to find it.
function milestoneHasUpload(milestone: JourneyMilestone): boolean {
  return milestone.documents.some((doc) => toDocStatus(doc.status) !== 'pending');
}

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

export type RenderDocAction = (doc: JourneyDocument, ctx: { level: JourneyLevel; milestone: JourneyMilestone }) => React.ReactNode;

function DefaultDocAction(doc: JourneyDocument) {
  const status = toDocStatus(doc.status);
  return <StatusBadge status={status} label={DOC_STATUS_LABEL[status]} />;
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
  milestone: JourneyMilestone;
  level: JourneyLevel;
  unlocked: boolean;
  isFirst: boolean;
  isLast: boolean;
  defaultOpen: boolean;
  renderDocAction: RenderDocAction;
}) {
  const [open, setOpen] = useState(defaultOpen || milestoneHasUpload(milestone));
  const verified = milestone.documents.filter((doc) => toDocStatus(doc.status) === 'verified').length;

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
        <StatusChip verified={verified} total={milestone.documents.length} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: `transform 0.2s ${EASE_CSS}`, transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>

      <Collapse in={open} timeout={220} easing={{ enter: EASE_CSS, exit: EASE_CSS }}>
        <Box sx={{ pl: 2.5, py: 0.5, display: 'flex', flexDirection: 'column' }}>
          {milestone.documents.map((doc, i) => (
            <Box
              key={doc.id}
              className="flex items-center gap-3"
              sx={{
                py: 1,
                borderBottom: i === milestone.documents.length - 1 ? 'none' : '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {doc.name}
              </Typography>
              {renderDocAction(doc, { level, milestone })}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

// Mobile has no room for the desktop tree's decorative trunk/elbow
// connectors (they either get clipped or force horizontal scroll once the
// left-edge indentation stacks up) — rather than shrinking that same layout
// until it's illegible, this is a distinct, deliberately simpler
// presentation: a centered stack of level cards, each a self-contained
// accordion with no connector lines at all. Same data and renderDocAction,
// so a mobile visitor sees the identical checklist, just laid out for a
// narrow, one-thing-at-a-time screen instead of a wide branching diagram.
function MobileMilestoneRow({
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
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      <Box
        className="flex items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        sx={{ cursor: 'pointer', userSelect: 'none', py: 1.25 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
          {milestone.name}
        </Typography>
        <StatusChip verified={verified} total={milestone.documents.length} />
        <ExpandMoreIcon
          fontSize="small"
          sx={{ color: 'text.secondary', transition: `transform 0.2s ${EASE_CSS}`, transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </Box>
      <Collapse in={open} timeout={220} easing={{ enter: EASE_CSS, exit: EASE_CSS }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', pb: 1 }}>
          {milestone.documents.map((doc) => (
            <Box key={doc.id} className="flex items-center gap-3" sx={{ py: 0.75 }}>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {doc.name}
              </Typography>
              {renderDocAction(doc, { level, milestone })}
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

function MobileLevelCard({
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
  const emoji = LEVEL_EMOJI[badge.code];

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textAlign: 'left',
        gap: 1,
      }}
    >
      <Box
        sx={{
          alignSelf: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.375rem',
          border: '2px solid',
          borderColor: unlocked ? 'success.main' : 'divider',
          boxShadow: unlocked
            ? '0 0 0 4px color-mix(in srgb, var(--mui-palette-success-main) 15%, transparent), 0 4px 16px -4px color-mix(in srgb, var(--mui-palette-success-main) 45%, transparent)'
            : 'none',
        }}
      >
        {emoji}
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        {badge.code} {badge.name} · {badge.pathway_name}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {badge.milestones.length} milestones · {totalDocs} documents
      </Typography>

      <Box
        className="flex items-center gap-1"
        sx={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.03em',
          px: 1.25,
          py: 0.375,
          borderRadius: '9999px',
          mt: 0.5,
          ...(unlocked ? { bgcolor: 'success.light', color: 'success.dark' } : { bgcolor: 'action.selected', color: 'text.secondary' }),
        }}
      >
        {unlocked ? <CheckCircleOutlinedIcon sx={{ fontSize: '0.875rem' }} /> : <LockOutlinedIcon sx={{ fontSize: '0.875rem' }} />}
        {unlocked ? 'UNLOCKED' : tier ? TIER_LABELS[tier] : ''}
      </Box>

      <Box sx={{ width: '100%', mt: 1 }}>
        <Box sx={{ height: 6, borderRadius: '4px', bgcolor: 'action.selected', overflow: 'hidden' }}>
          <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: '4px', bgcolor: unlocked ? 'success.main' : 'text.disabled', transition: 'width 0.4s ease' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums', mt: 0.5 }}>
          <span>{pct}%</span>
          <span>{verifiedDocs}/{totalDocs} verified</span>
        </Box>
      </Box>

      <Box sx={{ width: '100%', mt: 1 }}>
        {badge.milestones.map((milestone) => (
          <MobileMilestoneRow
            key={milestone.id}
            milestone={milestone}
            level={badge}
            renderDocAction={renderDocAction}
            defaultOpen={defaultMilestonesOpen}
          />
        ))}
      </Box>

      {!unlocked && tier && (
        <Box sx={{ width: '100%', mt: 1.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Upgrade to {TIER_LABELS[tier]} to unlock this level.
          </Typography>
          <GlowButton href="/billing" size="small">
            Upgrade →
          </GlowButton>
        </Box>
      )}
    </Box>
  );
}

function LevelNode({
  badge,
  unlocked,
  tier,
  isLast,
  defaultMilestonesOpen,
  renderDocAction,
}: {
  badge: JourneyLevel;
  unlocked: boolean;
  tier: Tier | undefined;
  isLast: boolean;
  defaultMilestonesOpen: boolean;
  renderDocAction: RenderDocAction;
}) {
  const totalDocs = levelTotalDocs(badge);
  const verifiedDocs = levelVerifiedDocs(badge);
  const pct = totalDocs === 0 ? 0 : Math.round((verifiedDocs / totalDocs) * 100);
  const emoji = LEVEL_EMOJI[badge.code];

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
        {emoji}
      </Box>

      <Box className="flex items-center gap-2" sx={{ minHeight: 40 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {badge.code} {badge.name} · {badge.pathway_name}
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
          {unlocked ? 'UNLOCKED' : tier ? TIER_LABELS[tier] : ''}
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
            key={milestone.id}
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

      {!unlocked && tier && (
        <Box className="flex items-center justify-between gap-3" sx={{ mt: 2, pl: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Upgrade to {TIER_LABELS[tier]} to unlock this level.
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
  levels: JourneyLevel[];
  isUnlocked: (level: JourneyLevel) => boolean;
  /** The subscription tier required for this level, for the locked-state badge/copy — real data from Package.tier via PackageProvider, not a hardcoded lookup. Undefined levels just show no tier badge. */
  tierFor?: (level: JourneyLevel) => Tier | undefined;
  /** Auto-expand every milestone — the Journey page wants collapsed-by-default (browsing), the Documents page wants everything open (acting on documents). */
  defaultMilestonesOpen?: boolean;
  /** What to render after each document's name — defaults to the plain status badge; the Documents page overrides this with real action buttons. */
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
//
// `isUnlocked` is caller-supplied rather than reading the real
// `level.unlocked` field directly, because callers mean different things by
// it: subscription-tier access vs. genuine journey-progress unlocking.
// Keeping it a prop lets each caller pick the right one without this
// component taking a position.
//
// Renders two layouts, toggled by CSS breakpoint (not JS/useMediaQuery, so
// there's no hydration flicker): the tree above for md+ screens, and a
// centered stack of plain accordion cards (MobileLevelCard) below for xs —
// see that component's own comment for why mobile doesn't just shrink the
// same connector-line diagram.
export function JourneyTree({ levels, isUnlocked, tierFor, defaultMilestonesOpen = false, renderDocAction = DefaultDocAction }: JourneyTreeProps) {
  return (
    <>
      <Box component={motion.div} variants={cardGridContainer} initial="hidden" animate="show" sx={{ pt: 1, display: { xs: 'none', md: 'block' } }}>
        {levels.map((badge, i) => (
          <Box component={motion.div} key={badge.code} variants={cardGridItem}>
            <LevelNode
              badge={badge}
              unlocked={isUnlocked(badge)}
              tier={tierFor?.(badge)}
              isLast={i === levels.length - 1}
              defaultMilestonesOpen={defaultMilestonesOpen}
              renderDocAction={renderDocAction}
            />
          </Box>
        ))}
      </Box>

      <Box
        component={motion.div}
        variants={cardGridContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
        sx={{ pt: 1, display: { xs: 'flex', md: 'none' } }}
      >
        {levels.map((badge) => (
          <Box component={motion.div} key={badge.code} variants={cardGridItem}>
            <MobileLevelCard
              badge={badge}
              unlocked={isUnlocked(badge)}
              tier={tierFor?.(badge)}
              defaultMilestonesOpen={defaultMilestonesOpen}
              renderDocAction={renderDocAction}
            />
          </Box>
        ))}
      </Box>
    </>
  );
}
