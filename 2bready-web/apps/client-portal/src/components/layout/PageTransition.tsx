'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { pageTransition } from '@2bready/ui-core';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    // popLayout, not wait — wait blocks the new page from mounting until the
    // old one's exit animation finishes, adding real latency to every
    // navigation. popLayout removes the exiting page from layout flow
    // immediately so the new one can mount and animate in right away.
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
