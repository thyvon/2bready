'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { Breadcrumbs, SectionCard, EmptyState, StatusBadge, UploadDropzone } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import { JourneyTree, type RenderDocAction } from '@/components/dashboard/JourneyTree';
import { BADGE_LEVELS, getAllDocuments, levelDocCount, type BadgeLevel, type DocStatus } from '@/lib/journey-data';

const FILTERS: Array<{ key: DocStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'review', label: 'In Review' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'expired', label: 'Expired' },
];

const STATUS_LABEL: Record<DocStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  review: 'In Review',
  rejected: 'Rejected',
  expired: 'Expired',
};

// One page for the whole journey — progress (badges, milestones, upgrade
// prompts) and document actions (upload/preview/download) used to be split
// across /journey and /documents, but both rendered the same tree over the
// same data. Merged rather than kept as two near-identical pages.
export default function JourneyPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/journey');
  const totalDocs = BADGE_LEVELS.reduce((sum, level) => sum + levelDocCount(level), 0);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DocStatus | 'all'>('all');
  const isFiltering = query.trim().length > 0 || filter !== 'all';

  // No upload API exists yet — "uploading" a file locally moves that one
  // document to 'review' so the flow is demoable, layered on top of the
  // seeded 'pending' data rather than replacing it.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, DocStatus>>({});
  const [uploadDoc, setUploadDoc] = useState<string | null>(null);

  const documents = useMemo(() => getAllDocuments(), []);
  const statusByName = useMemo(
    () => new Map(documents.map((d) => [d.name, statusOverrides[d.name] ?? d.status])),
    [documents, statusOverrides],
  );

  const filteredLevels: BadgeLevel[] = useMemo(() => {
    if (!isFiltering) return BADGE_LEVELS;
    const q = query.trim().toLowerCase();
    return BADGE_LEVELS.map((level) => ({
      ...level,
      milestones: level.milestones
        .map((milestone) => ({
          ...milestone,
          docs: milestone.docs.filter((doc) => {
            const status = statusByName.get(doc) ?? 'pending';
            const matchesFilter = filter === 'all' || status === filter;
            const matchesQuery = !q || doc.toLowerCase().includes(q);
            return matchesFilter && matchesQuery;
          }),
        }))
        .filter((milestone) => milestone.docs.length > 0),
    })).filter((level) => level.milestones.length > 0);
  }, [isFiltering, query, filter, statusByName]);

  const totalMatches = filteredLevels.reduce(
    (sum, level) => sum + level.milestones.reduce((s, m) => s + m.docs.length, 0),
    0,
  );

  const renderDocAction: RenderDocAction = (doc) => {
    const status = statusByName.get(doc) ?? 'pending';
    return (
      <Box className="flex items-center gap-2" sx={{ flexShrink: 0 }}>
        <StatusBadge status={status} label={STATUS_LABEL[status]} />
        {status === 'pending' && (
          <Tooltip title="Upload">
            <IconButton size="small" onClick={() => setUploadDoc(doc)}>
              <UploadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {(status === 'rejected' || status === 'expired') && (
          <Tooltip title="Re-upload">
            <IconButton size="small" onClick={() => setUploadDoc(doc)}>
              <RefreshOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {(status === 'verified' || status === 'review') && (
          <>
            <Tooltip title="Preview">
              <IconButton size="small">
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {status === 'verified' && (
              <Tooltip title="Download">
                <IconButton size="small">
                  <DownloadOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Box>
    );
  };

  return (
    <Box className="flex flex-col gap-6">
      <Breadcrumbs
        icon={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: 'text.primary',
              color: 'background.paper',
              flexShrink: 0,
            }}
          >
            {item?.icon}
          </Box>
        }
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Compliance Journey' }]}
      />

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'primary.main' }}>
          Journey → Level → Milestone → Documents
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.01em', mt: 0.5 }}>
          Your full compliance checklist
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 640 }}>
          {BADGE_LEVELS.length} levels · {totalDocs} documents total. Search or filter to find a document, or click a
          milestone to browse its checklist — Pro and Enterprise levels stay visible so you can see what upgrading
          unlocks.
        </Typography>
      </Box>

      <SectionCard>
        <Box className="flex flex-col gap-4">
          <TextField
            size="small"
            placeholder="Search documents..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                transition: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&.Mui-focused': {
                  boxShadow:
                    '0 0 0 3px color-mix(in srgb, var(--mui-palette-primary-main) 15%, transparent), 0 6px 20px -6px color-mix(in srgb, var(--mui-palette-primary-main) 40%, transparent)',
                },
              },
            }}
          />

          <Box className="flex items-center gap-1.5" sx={{ flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <Box
                key={f.key}
                onClick={() => setFilter(f.key)}
                sx={{
                  position: 'relative',
                  // Establishes its own stacking context so the pill's
                  // z-index:-1 below is scoped to this chip only — without
                  // this, -1 escapes to the nearest ancestor stacking
                  // context and paints behind SectionCard's own background,
                  // making the pill (and its text) invisible.
                  zIndex: 0,
                  cursor: 'pointer',
                  userSelect: 'none',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: filter === f.key ? 'background.paper' : 'text.secondary',
                  '&:hover': filter === f.key ? {} : { color: 'text.primary' },
                }}
              >
                {filter === f.key && (
                  <Box
                    component={motion.div}
                    layoutId="journey-filter-pill"
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    sx={{ position: 'absolute', inset: 0, borderRadius: '9999px', bgcolor: 'text.primary', zIndex: -1 }}
                  />
                )}
                {filter !== f.key && (
                  <Box sx={{ position: 'absolute', inset: 0, borderRadius: '9999px', bgcolor: 'action.selected', zIndex: -1 }} />
                )}
                {f.label}
              </Box>
            ))}
          </Box>

          {totalMatches === 0 ? (
            <EmptyState title="No documents match" description="Try a different search term or filter." />
          ) : (
            <JourneyTree
              levels={filteredLevels}
              isUnlocked={(level) => level.tier === 'free'}
              defaultMilestonesOpen={isFiltering}
              renderDocAction={renderDocAction}
            />
          )}
        </Box>
      </SectionCard>

      <UploadDropzone
        open={uploadDoc !== null}
        onClose={() => setUploadDoc(null)}
        title={uploadDoc ?? ''}
        onUpload={() => {
          if (uploadDoc) setStatusOverrides((prev) => ({ ...prev, [uploadDoc]: 'review' }));
          setUploadDoc(null);
        }}
      />
    </Box>
  );
}
