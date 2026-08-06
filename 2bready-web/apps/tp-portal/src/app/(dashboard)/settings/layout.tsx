'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import PageHeader from '@/components/ui/PageHeader';
import { useTranslation } from '@/lib/i18n';

// Grouped-tab shell for Settings — mirrors admin-portal's settings/layout.tsx
// pattern, so a new settings group is a new subfolder + one entry in this
// array (same shape as the admin's email/security tabs).
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { label: t('settings.tab_firm_pricing'), href: '/settings' },
    { label: t('settings.tab_firm_profile'), href: '/settings/firm' },
    { label: t('settings.tab_profile'), href: '/settings/profile' },
  ];
  // The first tab's href is a prefix of the second's, so it needs an exact
  // match; the rest are fine with startsWith (nested routes still highlight
  // their tab).
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
