import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SectionCard, EmptyState } from '@2bready/ui-core';

export interface DomainStubPageProps {
  title: string;
  description: string;
}

// Placeholder shape shared by every not-yet-implemented domain page — swap
// for the real page content once that domain is wired up to the API.
export function DomainStubPage({ title, description }: DomainStubPageProps) {
  return (
    <Box className="flex flex-col gap-6">
      <Typography variant="h4">{title}</Typography>
      <SectionCard>
        <EmptyState title="Coming soon" description={description} />
      </SectionCard>
    </Box>
  );
}
