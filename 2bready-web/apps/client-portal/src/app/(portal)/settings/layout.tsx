'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { PageHeader } from '@/components/layout/PageHeader';
import { useTranslation } from '@/lib/i18n';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { label: t('settings.tab_profile'), href: '/settings/profile' },
    { label: t('settings.tab_company'), href: '/settings/company' },
    { label: t('settings.tab_notifications'), href: '/settings/notifications' },
  ];

  const activeIndex = tabs.findIndex((tab) => pathname.startsWith(tab.href));

  return (
    <Box>
      <PageHeader title={t('settings.title')} />

      <Tabs value={activeIndex === -1 ? false : activeIndex} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((tab) => (
          <Tab key={tab.href} label={tab.label} component={Link} href={tab.href} />
        ))}
      </Tabs>

      {children}
    </Box>
  );
}
