'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

// Mirrors admin-portal's own ToastProvider (components/feedback/ToastProvider.tsx)
// exactly — same shape, same API — so toast behavior is consistent across
// both apps in this monorepo, not a one-off invented for client-portal.
type Severity = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  toast: (message: string, severity?: Severity) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, severity: Severity = 'info') => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, severity }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const success = useCallback((m: string) => toast(m, 'success'), [toast]);
  const error = useCallback((m: string) => toast(m, 'error'), [toast]);
  const info = useCallback((m: string) => toast(m, 'info'), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      {toasts.map((t, i) => (
        <Snackbar key={t.id} open anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} sx={{ bottom: `${24 + i * 64}px !important` }}>
          <Alert severity={t.severity} variant="filled" onClose={() => dismiss(t.id)} sx={{ minWidth: 280, fontSize: '0.875rem' }}>
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
