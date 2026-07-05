import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SectionCard, StatusBadge } from '@2bready/ui-core';

export default function OverviewPage() {
  return (
    <Box className="flex flex-col gap-6">
      <Box>
        <Typography variant="h4">Overview</Typography>
        <Typography variant="body1" color="text.secondary">
          Your compliance readiness at a glance.
        </Typography>
      </Box>

      <SectionCard title="Compliance Journey" action={<StatusBadge status="in_progress" label="In progress" />}>
        <Typography variant="body2" color="text.secondary">
          Journey status and next steps will appear here once the journey domain is wired up.
        </Typography>
      </SectionCard>
    </Box>
  );
}
