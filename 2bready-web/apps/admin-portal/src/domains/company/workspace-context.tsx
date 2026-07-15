'use client';

import { createContext, useContext } from 'react';
import type { Company } from './types';

interface CompanyWorkspaceValue {
  company: Company;
  reload: () => void;
  // Lets a tab (e.g. after verifying a document) tell the layout's tab-badge
  // counts to refetch immediately, instead of waiting for the next navigation.
  refreshCounts: () => void;
}

// Populated by companies/[id]/layout.tsx, which owns the single fetch/reload
// for every tab under that route — tabs read the already-loaded company from
// here instead of each re-fetching it. Lives in domains/company (not the app/
// route tree) so domain components like DocumentsListView/PaymentsListView
// can read it too, without a domain depending on the app router layer.
const CompanyWorkspaceContext = createContext<CompanyWorkspaceValue | null>(null);

export const CompanyWorkspaceProvider = CompanyWorkspaceContext.Provider;

export function useCompanyWorkspace(): CompanyWorkspaceValue {
  const value = useContext(CompanyWorkspaceContext);
  if (!value) throw new Error('useCompanyWorkspace must be used within the companies/[id] layout');
  return value;
}

// Non-throwing variant for components shared with the global (non-company)
// pages, e.g. DocumentsListView/PaymentsListView — outside a company
// workspace this is simply null and the caller no-ops.
export function useCompanyWorkspaceOptional(): CompanyWorkspaceValue | null {
  return useContext(CompanyWorkspaceContext);
}
