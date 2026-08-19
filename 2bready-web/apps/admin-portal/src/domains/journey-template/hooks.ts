import { useCallback, useEffect, useState } from 'react';
import { getJourneyTemplate, listJourneyTemplates } from './api';
import type { JourneyTemplate } from './types';

export function useJourneyTemplates() {
  const [journeyTemplates, setJourneyTemplates] = useState<JourneyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listJourneyTemplates();
        if (!cancelled) setJourneyTemplates(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return {
    journeyTemplates,
    loading,
    setJourneyTemplates,
    reload: () => setReloadKey((k) => k + 1),
  };
}

export function useJourneyTemplate(id: string) {
  const [journeyTemplate, setJourneyTemplate] = useState<JourneyTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getJourneyTemplate(id);
        if (!cancelled) setJourneyTemplate(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  // Silent in-place refetch — never flips `loading`, so callers can reconcile
  // with server truth (e.g. reverting an optimistic edit after an API error)
  // without unmounting the tree, collapsing the accordions, or losing scroll.
  const refresh = useCallback(async () => {
    try {
      const data = await getJourneyTemplate(id);
      setJourneyTemplate(data);
    } catch {
      // Keep current tree on failure — the caller already surfaced the error.
    }
  }, [id]);

  return {
    journeyTemplate,
    loading,
    // Exposed for optimistic local reordering during drag-and-drop — the
    // caller updates the in-memory tree immediately for a smooth drag
    // experience, persists via the API, then calls reload() to reconcile
    // with server truth.
    setJourneyTemplate,
    refresh,
    reload: () => setReloadKey((k) => k + 1),
  };
}
