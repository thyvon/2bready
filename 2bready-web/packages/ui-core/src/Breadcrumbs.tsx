'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export interface BreadcrumbItem {
  label: string;
  /** Omit on the current (last) page — it renders as the page title, not a link. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Optional leading element (e.g. a domain icon badge) rendered before the trail. */
  icon?: React.ReactNode;
}

// Deliberately just `items: BreadcrumbItem[]` (not "top-level domain" specific)
// so a future sub-page (e.g. /audits/[id]) can render a 3+ segment trail —
// Overview / Audits / Audit #123 — by passing more items, not a different
// component.
//
// The trail doubles as the page header — there's no separate "title" element
// above/below it. The last segment renders at title size/weight (h4); every
// earlier segment is a small muted link. This is deliberate: a title and a
// breadcrumb saying the same thing on two lines is redundant.
export function Breadcrumbs({ items, icon }: BreadcrumbsProps) {
  const lastIndex = items.length - 1;

  return (
    <Box className="flex items-center gap-3">
      {icon}
      <MuiBreadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 20, color: 'text.disabled' }} />}
      >
        {items.map((item, index) => {
          const isLast = index === lastIndex;

          if (isLast || !item.href) {
            return (
              <Typography key={item.label} variant="h4" color={isLast ? 'text.primary' : 'text.secondary'}>
                {item.label}
              </Typography>
            );
          }

          return (
            <Typography
              key={item.label}
              component={Link}
              href={item.href}
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'none',
                '&:hover': { color: 'text.primary', textDecoration: 'underline' },
              }}
            >
              {item.label}
            </Typography>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
