'use client';

import Box from '@mui/material/Box';
import { Breadcrumbs, SectionCard, EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems, type DomainHref } from './nav-items';

export interface DomainStubPageProps {
  href: DomainHref;
}

// Placeholder shape shared by every not-yet-implemented domain page — swap
// for the real page content once that domain is wired up to the API. Title
// and description are resolved from nav-items.tsx (single source, also used
// by the Overview tile grid) rather than duplicated per page.
//
// The header is a Breadcrumbs trail, not a separate title — today it's just
// Overview / <domain>, but a future sub-page (e.g. /audits/[id]) extends the
// same `items` array to Overview / Audits / Audit #123 rather than needing a
// different header component.
export function DomainStubPage({ href }: DomainStubPageProps) {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === href);

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
              // 8px — the theme's card/menu radius tier, matching SectionCard
              // right below it, not the 10px dialog tier this used to be.
              borderRadius: '8px',
              // Monochrome (black-on-white / white-on-black), matching the
              // rest of the app's Vercel-style palette — not the blue accent.
              bgcolor: 'text.primary',
              color: 'background.paper',
              flexShrink: 0,
            }}
          >
            {item?.icon}
          </Box>
        }
        items={[
          { label: t('nav.overview'), href: '/' },
          { label: item?.label ?? href },
        ]}
      />
      <SectionCard>
        <EmptyState title={t('stub.coming_soon')} description={item?.description} />
      </SectionCard>
    </Box>
  );
}
