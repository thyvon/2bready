'use client';

import Link from 'next/link';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { motion } from 'framer-motion';
import { cardGridItem } from '@2bready/ui-core';
import type { NavItem } from './nav-items';

export function DomainTile({ item }: { item: NavItem }) {
  return (
    <motion.div variants={cardGridItem} whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>
      {/* Uses the real MUI Card (theme-styled: border/radius/background come
          from the single MuiCard override in theme/index.ts) instead of a
          hand-rolled Box that would duplicate those values and could drift. */}
      <Card
        component={Link}
        href={item.href}
        sx={{
          display: 'block',
          height: '100%',
          textDecoration: 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: '0 8px 24px -12px color-mix(in srgb, var(--mui-palette-primary-main) 40%, transparent)',
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" color="text.primary" sx={{ mb: 0.75 }}>
            {item.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}
