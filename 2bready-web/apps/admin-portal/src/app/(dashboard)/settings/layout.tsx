'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import PageHeader from '@/components/ui/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from '@/lib/i18n';

// Grouped-tab shell for Settings — mirrors companies/[id]/layout.tsx's own
// Tabs pattern, so this scales the same way as more settings groups get
// added later (a new tab is a new subfolder + one entry in this array, same
// as Journey/Payments/Users did for the company workspace).
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasRole } = useAuthStore();
  const { t } = useTranslation();

  const tabs = [
    // settings.manage (RolePermissionSeeder) is admin-only — staff/finance
    // never get it, so this tab simply doesn't render for them rather than
    // 403ing after a click.
    ...(hasRole('admin') ? [{ label: t('settings.tab_integrations'), href: '/settings' }] : []),
    ...(hasRole('admin') ? [{ label: t('settings.tab_email'), href: '/settings/email' }] : []),
    { label: t('settings.tab_profile'), href: '/settings/profile' },
  ];
  // Integrations' href is a prefix of every other tab's href, so it needs an
  // exact match; the rest are fine with startsWith (nested routes still
  // highlight their tab).
  const activeIndex = tabs.findIndex((tab, i) => (i === 0 ? pathname === tab.href : pathname.startsWith(tab.href)));

  return (
    <>
      <PageHeader title={t('nav.settings')} />

      <Tabs value={activeIndex === -1 ? false : activeIndex} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((tab) => (
          <Tab key={tab.href} label={tab.label} component={Link} href={tab.href} />
        ))}
      </Tabs>

      {children}
    </>
  );
}
