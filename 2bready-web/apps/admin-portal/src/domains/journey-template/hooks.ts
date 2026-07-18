import { useEffect, useState } from 'react';
import { getJourneyTemplate, listJourneyTemplates } from './api';
import type { JourneyTemplate } from './types';

export function useJourneyTemplates() {
  const [journeyTemplates, setJourneyTemplates] = useState<JourneyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumped after a successful create/edit/delete to trigger the effect below
  // without ever calling setState synchronously from outside an effect body.
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

  return { journeyTemplates, loading, reload: () => setReloadKey((k) => k + 1) };
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

  return { journeyTemplate, loading, reload: () => setReloadKey((k) => k + 1) };
}
