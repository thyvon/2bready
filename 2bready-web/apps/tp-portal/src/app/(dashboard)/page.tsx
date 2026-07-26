'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// No general admin dashboard yet — Companies is the only built-out section so far.
export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/companies');
  }, [router]);

  return null;
}
