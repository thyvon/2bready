import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SectionCard, EmptyState } from '@2bready/ui-core';
import { CLIENT_NAV, type DomainHref, type NavItem } from './nav-items';

export interface DomainStubPageProps {
  href: DomainHref;
}

// Placeholder shape shared by every not-yet-implemented domain page — swap
// for the real page content once that domain is wired up to the API. Title
// and description are resolved from nav-items.tsx (single source, also used
// by the Overview tile grid) rather than duplicated per page.
export function DomainStubPage({ href }: DomainStubPageProps) {
  // Widened to the general NavItem shape — CLIENT_NAV's `as const` gives each
  // entry its own exact literal type (only some have `description`), so
  // `.find()`'s result union doesn't expose `description` without this.
  const item: NavItem | undefined = CLIENT_NAV.find((i) => i.href === href);

  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="h4">{item?.label ?? href}</Typography>
      <SectionCard>
        <EmptyState title="Coming soon" description={item?.description} />
      </SectionCard>
    </Box>
  );
}
