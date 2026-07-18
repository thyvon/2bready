'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/feedback/ToastProvider';
import { listRoles } from '@/domains/user/api';
import type { Role } from '@/domains/user/types';
import { getApiError } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Read-only — the 6 roles are fixed, seeded server-side (RolePermissionSeeder),
// not editable here. This page exists purely so an admin can see what each
// role can actually do, not to manage it (see the "fixed roles" scope
// decision for Users/Roles).
export default function RolesPage() {
  const router = useRouter();
  const { hasAnyRole } = useAuthStore();
  const toast = useToast();
  const { t } = useTranslation();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAnyRole(['admin', 'staff', 'finance'])) router.replace('/dashboard');
  }, [hasAnyRole, router]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      try {
        const data = await listRoles();
        if (!cancelled) setRoles(data);
      } catch (err) {
        if (!cancelled) toast.error(getApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader title={t('roles.title')} />

      {loading ? (
        <Box className="flex justify-center py-16">
          <CircularProgress />
        </Box>
      ) : (
        <Box className="flex flex-col gap-4">
          {roles.map((role) => (
            <SectionCard key={role.name} title={role.name}>
              {role.permissions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('roles.no_permissions')}
                </Typography>
              ) : (
                <Box className="flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <Chip key={permission} label={permission} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
            </SectionCard>
          ))}
        </Box>
      )}
    </>
  );
}
