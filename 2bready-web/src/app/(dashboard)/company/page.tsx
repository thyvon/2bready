'use client';

import { useAuthStore } from '@/store/auth.store';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

export default function CompanyDashboardPage() {
  const { user } = useAuthStore();

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'}`}
        subtitle="Here's an overview of your compliance status."
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Company Status">
            <Box className="flex items-center gap-2">
              <StatusBadge status="active" />
              <Typography variant="body2" color="text.secondary">Account active</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Compliance Level">
            <Box className="flex items-center gap-2">
              <StatusBadge status="pending" label="Not started" />
              <Typography variant="body2" color="text.secondary">Begin your journey</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SectionCard title="Subscription">
            <Box className="flex items-center gap-2">
              <StatusBadge status="pending" label="No plan" />
              <Typography variant="body2" color="text.secondary">Choose a package</Typography>
            </Box>
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <SectionCard title="Recent Activity" subtitle="Your last actions will appear here">
            <Box className="py-8 text-center">
              <Typography variant="body2" color="text.secondary">No activity yet — Sprint 2 content coming soon.</Typography>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
}
