'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { Breadcrumbs, SectionCard, EmptyState, PillToggle } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems } from '@/components/layout/nav-items';
import {
  CLIENT_MATCHING_EXPERTISE,
  EXPERTISE_LABELS,
  TP_PARTNERS,
  matchesClientIndustry,
  specialPrice,
  type TpPartner,
} from '@/lib/tp-data';

type Scope = 'matching' | 'all';

function PriceChip({ level, list }: { level: string; list: number }) {
  const special = specialPrice(list);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 1.5, py: 0.75, borderRadius: '8px', bgcolor: 'action.selected', minWidth: 64 }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
        {level}
      </Typography>
      <Box className="flex items-baseline gap-1">
        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
          ${list}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
          ${special}
        </Typography>
      </Box>
    </Box>
  );
}

function PartnerRow({ partner, hired, onHire, onRemove }: { partner: TpPartner; hired: boolean; onHire: () => void; onRemove: () => void }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: hired ? 'primary.main' : 'divider',
        borderRadius: '8px',
        p: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box className="flex items-center gap-2 flex-wrap">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {partner.name}
          </Typography>
          <Box sx={{ fontSize: '0.6875rem', fontWeight: 600, px: 1, py: 0.25, borderRadius: '9999px', bgcolor: 'action.selected', color: 'text.secondary' }}>
            {EXPERTISE_LABELS[partner.expertise]}
          </Box>
          {hired && (
            <Box className="flex items-center gap-0.5" sx={{ fontSize: '0.6875rem', fontWeight: 700, color: 'success.main' }}>
              <VerifiedUserOutlinedIcon sx={{ fontSize: '0.875rem' }} /> HIRED
            </Box>
          )}
        </Box>
        <Box className="flex items-center gap-1.5" sx={{ mt: 0.5 }}>
          <Rating value={partner.rating} precision={0.1} readOnly size="small" />
          <Typography variant="caption" color="text.secondary">
            {partner.rating} ({partner.reviewCount} reviews)
          </Typography>
        </Box>
      </Box>

      <Box className="flex items-center gap-2 flex-wrap">
        <PriceChip level="L2" list={partner.priceL2} />
        <PriceChip level="L3" list={partner.priceL3} />
        <PriceChip level="L4" list={partner.priceL4} />
      </Box>

      {hired ? (
        <Button variant="outlined" color="error" size="small" startIcon={<PersonRemoveOutlinedIcon />} onClick={onRemove} sx={{ flexShrink: 0 }}>
          Remove
        </Button>
      ) : (
        <Button variant="contained" size="small" startIcon={<HandshakeOutlinedIcon />} onClick={onHire} sx={{ flexShrink: 0 }}>
          Hire
        </Button>
      )}
    </Box>
  );
}

export default function AuditsPage() {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === '/audits');

  const [scope, setScope] = useState<Scope>('matching');
  const [hiredId, setHiredId] = useState<string | null>(null);

  const partners = useMemo(() => (scope === 'matching' ? TP_PARTNERS.filter(matchesClientIndustry) : TP_PARTNERS), [scope]);
  const hiredPartner = TP_PARTNERS.find((p) => p.id === hiredId) ?? null;

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
        items={[{ label: t('nav.overview'), href: '/' }, { label: item?.label ?? 'Audits' }]}
      />

      <Typography variant="body2" color="text.secondary">
        Hire a licensed third-party auditor to verify your documents for L2 and above. By default we only show firms
        that match your industry — {EXPERTISE_LABELS[CLIENT_MATCHING_EXPERTISE[0]]} — not every audit specialty.
      </Typography>

      <SectionCard title="Your Auditor" subtitle={hiredPartner ? `Hired for L2–L4 verification` : undefined}>
        {hiredPartner ? (
          <PartnerRow partner={hiredPartner} hired onHire={() => {}} onRemove={() => setHiredId(null)} />
        ) : (
          <EmptyState
            icon={<HandshakeOutlinedIcon fontSize="inherit" />}
            title="No auditor hired yet"
            description="Hire a firm from the marketplace below to start L2+ verification."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Marketplace"
        action={
          <PillToggle
            options={[
              { key: 'matching', label: 'Matches your industry' },
              { key: 'all', label: 'All specialties' },
            ]}
            value={scope}
            onChange={setScope}
            layoutId="audits-scope-pill"
          />
        }
      >
        {partners.length === 0 ? (
          <EmptyState title="No matching auditors" description="Try widening your search to all specialties." />
        ) : (
          <Box className="flex flex-col gap-3">
            {partners.map((partner) => (
              <PartnerRow
                key={partner.id}
                partner={partner}
                hired={partner.id === hiredId}
                onHire={() => setHiredId(partner.id)}
                onRemove={() => setHiredId(null)}
              />
            ))}
          </Box>
        )}
      </SectionCard>
    </Box>
  );
}
