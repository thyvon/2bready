'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useNavItems, isNavItemActive } from '@/components/layouts/nav-items';

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

interface Crumb {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  const pathname = usePathname();
  const navItems = useNavItems();

  // useNavItems() always returns at least the Dashboard root as item 0 (see
  // nav-items.tsx) — never empty, so root is always defined here.
  const root = navItems[0];
  const section = navItems.find((item) => item.href !== root.href && isNavItemActive(pathname, item));
  const onSectionRoot = pathname === root.href;

  const crumbs: Crumb[] = [{ label: root.label, href: onSectionRoot ? undefined : root.href, icon: root.icon }];
  if (section) crumbs.push({ label: section.label, href: section.href, icon: section.icon });
  // A drill-down page (e.g. a specific company's documents) isn't itself a nav
  // item — its own title becomes the trail's final, non-clickable crumb,
  // mirroring admin-portal's PageHeader.
  if (!onSectionRoot) crumbs.push({ label: title });

  return (
    <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          const content = (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {crumb.icon}
              <Typography
                variant={isLast ? 'h6' : 'body2'}
                component="span"
                color={isLast ? 'text.primary' : 'text.secondary'}
                sx={{ fontWeight: isLast ? 600 : 500 }}
              >
                {crumb.label}
              </Typography>
            </Box>
          );

          if (crumb.href) {
            return (
              <Box
                key={crumb.href}
                component={Link}
                href={crumb.href}
                sx={{ textDecoration: 'none', '&:hover .MuiTypography-root': { color: 'text.primary' } }}
              >
                {content}
              </Box>
            );
          }
          return <Box key={crumb.label}>{content}</Box>;
        })}
      </Breadcrumbs>
      {action && <Box className="shrink-0">{action}</Box>}
    </Box>
  );
}
