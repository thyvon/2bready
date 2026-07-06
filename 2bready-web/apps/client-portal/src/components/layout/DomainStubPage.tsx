'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SectionCard, EmptyState } from '@2bready/ui-core';
import { useTranslation } from '@/lib/i18n';
import { useNavItems, type DomainHref } from './nav-items';

export interface DomainStubPageProps {
  href: DomainHref;
}

// Placeholder shape shared by every not-yet-implemented domain page — swap
// for the real page content once that domain is wired up to the API. Title
// and description are resolved from nav-items.tsx (single source, also used
// by the Overview tile grid) rather than duplicated per page.
export function DomainStubPage({ href }: DomainStubPageProps) {
  const { t } = useTranslation();
  const { all } = useNavItems();
  const item = all.find((i) => i.href === href);

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="h4">{item?.label ?? href}</Typography>
      <SectionCard>
        <EmptyState title={t('stub.coming_soon')} description={item?.description} />
      </SectionCard>
    </Box>
  );
}
