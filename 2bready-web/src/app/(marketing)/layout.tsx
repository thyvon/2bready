'use client';

import { MotionConfig } from 'framer-motion';
import MarketingHeader from '@/components/layouts/MarketingHeader';
import MarketingFooter from '@/components/layouts/MarketingFooter';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </MotionConfig>
  );
}
