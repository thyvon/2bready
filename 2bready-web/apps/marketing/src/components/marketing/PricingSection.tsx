'use client';

import { useState } from 'react';
import Skeleton from '@mui/material/Skeleton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CheckIcon from '@mui/icons-material/Check';
import DescriptionIcon from '@mui/icons-material/Description';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import PublicIcon from '@mui/icons-material/Public';
import { motion } from 'framer-motion';
import Reveal from './Reveal';
import SpotlightCard from './SpotlightCard';
import GlowButton from './GlowButton';
import { pricingContent } from './content';
import { usePublicPricing, formatPrice, yearlySavePct } from './usePublicPricing';

const PLAN_ICONS = {
  compliance: DescriptionIcon,
  product: AutoAwesomeIcon,
  operational: SettingsIcon,
  global: PublicIcon,
};

type BillingPeriod = 'monthly' | 'yearly';

// SAMPLE tooltip copy — the API doesn't carry milestone/document-template
// descriptions yet. Swap these for the real fields once they exist.
const sampleMilestoneTip = (name: string): string =>
  `${name} — one of the compliance areas verified at this level. Hover any document below to see what it covers.`;

const sampleDocumentTip = (name: string): string =>
  `${name} — a required document proving this requirement. Upload it in the portal and ADMIT auditors verify it automatically.`;

function PeriodToggle({
  value,
  onChange,
  savePct,
}: {
  value: BillingPeriod;
  onChange: (v: BillingPeriod) => void;
  savePct: number | null;
}) {
  const options: Array<{ key: BillingPeriod; label: string }> = [
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ];

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 6 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          p: 0.5,
          borderRadius: '9999px',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {options.map((option) => {
          const active = value === option.key;
          const showSaveTag = option.key === 'yearly' && savePct != null;
          return (
            <Box
              key={option.key}
              onClick={() => onChange(option.key)}
              sx={{
                position: 'relative',
                zIndex: 0,
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                minWidth: 112,
                px: 2,
                py: 0.75,
                borderRadius: '9999px',
                fontSize: '0.875rem',
                fontWeight: 700,
                transition: 'color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                color: active ? 'background.paper' : 'text.secondary',
                '&:hover': active ? {} : { color: 'text.primary' },
              }}
            >
              {active ? (
                <Box
                  component={motion.div}
                  layoutId="pricing-period-pill"
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  sx={{ position: 'absolute', inset: 0, borderRadius: '9999px', bgcolor: 'primary.main', zIndex: -1 }}
                />
              ) : (
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '9999px', bgcolor: 'transparent', zIndex: -1 }} />
              )}
              {option.label}
              {showSaveTag && (
                <Box
                  component="span"
                  sx={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    px: 0.75,
                    py: 0.125,
                    borderRadius: '9999px',
                    bgcolor: 'success.main',
                    color: 'success.contrastText',
                  }}
                >
                  {`Save ${savePct}%`}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function PricingSection() {
  const { plans: pricingPlans, loading } = usePublicPricing();
  const [period, setPeriod] = useState<BillingPeriod>('yearly');
  // One shared "Show details" toggle across the grid — visitors compare
  // levels side by side, so the detail expansion should be all-or-nothing.
  const [showDetails, setShowDetails] = useState(false);

  // The toggle's "Save %" tag mirrors the yearly cadence's discount. Every
  // level shares the same ratio today (data-driven), so one representative
  // value keeps the toggle clean; the per-card badge stays accurate per plan.
  const toggleSavePct =
    pricingPlans.reduce<number | null>((acc, plan) => {
      if (acc != null) return acc;
      return yearlySavePct(plan.monthlyCents, plan.yearlyCents);
    }, null);

  return (
    <Box component="section" id="pricing" sx={{ bgcolor: 'background.default', py: 'clamp(4.5rem, 3rem + 6vw, 8rem)' }}>
      <Box sx={{ px: 'clamp(1rem, 0.5rem + 2vw, 2.5rem)', maxWidth: 1440, mx: 'auto' }}>
      <Reveal>
        <Typography
          variant="overline"
          sx={{ display: 'block', textAlign: 'center', color: 'success.main', fontWeight: 800, letterSpacing: '0.14em', mb: 1.5 }}
        >
          {pricingContent.kicker}
        </Typography>
        <Typography variant="h2" component="h2" sx={{ textAlign: 'center', textWrap: 'balance', mb: 2 }}>
          {pricingContent.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 720, mx: 'auto', mb: 'clamp(3rem, 2rem + 3vw, 4.5rem)' }}>
          {pricingContent.subtitle}
        </Typography>
      </Reveal>

      <PeriodToggle value={period} onChange={setPeriod} savePct={toggleSavePct} />

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Box
          onClick={() => setShowDetails((v) => !v)}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            cursor: 'pointer',
            userSelect: 'none',
            px: 2,
            py: 0.75,
            borderRadius: '9999px',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: showDetails ? 'primary.main' : 'text.secondary',
          }}
        >
          {showDetails ? 'Hide document details' : 'Show document details'}
          <ExpandMoreIcon
            sx={{
              fontSize: 18,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: showDetails ? 'rotate(180deg)' : 'none',
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 'clamp(1rem, 0.5rem + 2vw, 1.75rem)',
          alignItems: 'stretch',
        }}
      >
        {loading &&
          [0, 1, 2, 3].map((i) => (
            <SpotlightCard key={i} sx={{ height: '100%', p: 'clamp(1.25rem, 0.875rem + 1.5vw, 2rem)' }}>
              <Skeleton variant="rounded" width="70%" height={32} sx={{ mb: 3.5 }} />
              <Skeleton variant="text" width="45%" height={36} />
              <Skeleton variant="text" width="90%" />
              <Skeleton variant="text" width="95%" />
              <Skeleton variant="text" width="85%" />
              <Skeleton variant="rectangular" height={40} sx={{ mt: 4, borderRadius: 2 }} />
            </SpotlightCard>
          ))}
        {!loading && pricingPlans.map((plan, i) => {
          const Icon = PLAN_ICONS[plan.icon];
          const monthly = plan.monthlyCents;
          const yearly = plan.yearlyCents;
          const isFree = (monthly ?? 0) === 0 && (yearly ?? 0) === 0;
          const priceCents = period === 'monthly' && monthly != null ? monthly : (yearly ?? monthly ?? 0);
          const displayPeriod = period === 'monthly' && monthly != null ? 'monthly' : 'yearly';
          const save = yearlySavePct(monthly, yearly);

          return (
            <Reveal key={plan.level} delay={i * 0.08} scale>
              <Box sx={{ height: '100%' }}>
                <SpotlightCard sx={{ height: '100%', p: 'clamp(1.25rem, 0.875rem + 1.5vw, 2rem)' }}>
                  <Chip
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Icon sx={{ fontSize: 18 }} />
                        {`${plan.level}: ${plan.name}`}
                      </Box>
                    }
                    size="small"
                    sx={{
                      alignSelf: 'flex-start',
                      mb: 3.5,
                      fontWeight: 700,
                      height: 'auto',
                      py: 0.75,
                      fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)',
                      bgcolor: 'color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)',
                      color: 'primary.main',
                      '& .MuiChip-label': { display: 'flex', alignItems: 'center', px: 0.75 },
                    }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mb: 0.5 }}>
                    <Typography variant="h3" component="span" sx={{ fontWeight: 900, fontSize: 'clamp(1.375rem, 1.25rem + 0.75vw, 1.75rem)' }}>
                      {formatPrice(priceCents)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {displayPeriod === 'monthly' ? '/ mo' : '/ yr'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 28, mb: 1.5 }}>
                    {displayPeriod === 'yearly' && save != null && !isFree && (
                      <Chip
                        label={`Save ${save}%`}
                        size="small"
                        sx={{ height: 20, fontWeight: 800, fontSize: '0.6875rem', bgcolor: 'success.main', color: 'success.contrastText' }}
                      />
                    )}
                    {displayPeriod === 'yearly' && monthly != null && !isFree && (
                      <Typography variant="caption" color="text.secondary">
                        {formatPrice(monthly)}/mo billed yearly
                      </Typography>
                    )}
                    {displayPeriod === 'monthly' && yearly != null && !isFree && (
                      <Typography variant="caption" color="text.secondary">
                        or {formatPrice(yearly)}/yr
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: isFree ? 'success.main' : 'text.secondary', fontWeight: 700, mb: 3, display: 'block' }}
                  >
                    {plan.fee}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem', mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                    {plan.description}
                  </Typography>

                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mb: 4 }}>
                    {plan.milestones.map((milestone) => (
                      <Box component="li" key={milestone.name} sx={{ mb: 2 }}>
                        <Tooltip title={sampleMilestoneTip(milestone.name)} arrow placement="top">
                          <Box className="milestone-row" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, cursor: 'help' }}>
                            <CheckIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.25 }} />
                            <Typography variant="body2" color="text.secondary">
                              {milestone.name}
                            </Typography>
                            <InfoOutlinedIcon
                              sx={{
                                fontSize: 14,
                                color: 'text.disabled',
                                mt: 0.4,
                                opacity: 0,
                                transition: 'opacity 0.15s',
                                '.milestone-row:hover &': { opacity: 1 },
                              }}
                            />
                          </Box>
                        </Tooltip>
                        {showDetails && milestone.documents.length > 0 && (
                          <Box
                            component="ul"
                            sx={{ listStyle: 'none', p: 0, m: 0, mt: 1, ml: 3.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}
                          >
                            {milestone.documents.map((doc) => (
                              <Tooltip key={doc} title={sampleDocumentTip(doc)} arrow placement="right">
                                <Box
                                  component="li"
                                  className="doc-row"
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    pl: 1.25,
                                    borderLeft: '2px solid',
                                    borderColor: 'divider',
                                    cursor: 'help',
                                  }}
                                >
                                  <DescriptionIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {doc}
                                  </Typography>
                                  <InfoOutlinedIcon
                                    sx={{
                                      fontSize: 12,
                                      color: 'text.disabled',
                                      opacity: 0,
                                      transition: 'opacity 0.15s',
                                      '.doc-row:hover &': { opacity: 1 },
                                    }}
                                  />
                                </Box>
                              </Tooltip>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <GlowButton href={plan.cta.href} size="medium">
                      {plan.cta.label}
                    </GlowButton>
                  </Box>
                </SpotlightCard>
              </Box>
            </Reveal>
          );
        })}
      </Box>
      </Box>
    </Box>
  );
}