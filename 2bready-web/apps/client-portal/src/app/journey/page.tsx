'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { Breadcrumbs, SectionCard, EmptyState, StatusBadge } from '@2bready/ui-core';
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

  const documents = useMemo(() => getAllDocuments(), []);
  const statusByName = useMemo(() => new Map(documents.map((d) => [d.name, d.status])), [documents]);

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
            <IconButton size="small">
              <UploadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {(status === 'rejected' || status === 'expired') && (
          <Tooltip title="Re-upload">
            <IconButton size="small">
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

      <Typography variant="body2" color="text.secondary">
        {BADGE_LEVELS.length} levels · {totalDocs} documents total. Search or filter to find a document, or click a
        milestone to browse its checklist — Pro and Enterprise levels stay visible so you can see what upgrading
        unlocks.
      </Typography>

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
          />

          <Box className="flex items-center gap-1.5" sx={{ flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <Box
                key={f.key}
                onClick={() => setFilter(f.key)}
                sx={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'background-color 0.1s ease',
                  ...(filter === f.key
                    ? { bgcolor: 'text.primary', color: 'background.paper' }
                    : { bgcolor: 'action.selected', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }),
                }}
              >
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
    </Box>
  );
}
