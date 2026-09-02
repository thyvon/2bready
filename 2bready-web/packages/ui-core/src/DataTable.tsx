'use client';

import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { EmptyState } from './EmptyState';

/* ── Column ────────────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string;
  label: string;
  minWidth?: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  /** Custom cell renderer. Receives the raw column value + the full row. */
  render?: (row: T, value: unknown) => React.ReactNode;
  /** If false, column is excluded from search filtering. Default: true. */
  searchable?: boolean;
}

/* ── Server-side pagination (optional) ─────────────────────────────────── */

export interface DataTablePagination {
  /** 1-indexed page (Laravel paginator convention). */
  page: number;
  perPage: number;
  total: number;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

/* ── Props ─────────────────────────────────────────────────────────────── */

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  /**
   * Server-side pagination. When provided, the table delegates page/perPage
   * management to the caller (rows are expected to be pre-sliced).
   * When omitted, the table manages pagination internally (client-side).
   */
  pagination?: DataTablePagination;
  /* ── Client-side only options ───────────────────────────────────────── */
  rowsPerPageOptions?: number[];
  defaultRowsPerPage?: number;
  maxHeight?: number;
  searchPlaceholder?: string;
  /** Extra toolbar content rendered to the right of the search input. */
  toolbarExtra?: React.ReactNode;
  /** Set to false to hide the search toolbar entirely. */
  showSearch?: boolean;
  /* ── Row selection ──────────────────────────────────────────────────── */
  /** Selected row IDs. Pass undefined to disable selection entirely. */
  selected?: string[];
  /** Callback when selection changes. Required when `selected` is provided. */
  onSelectionChange?: (selected: string[]) => void;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowClick,
  pagination,
  rowsPerPageOptions = [10, 25, 100],
  defaultRowsPerPage = 10,
  maxHeight = 440,
  searchPlaceholder = 'Search…',
  toolbarExtra,
  showSearch = true,
  selected,
  onSelectionChange,
}: DataTableProps<T>) {
  const isServerPaginated = Boolean(pagination);
  const isSelectable = selected !== undefined && onSelectionChange !== undefined;

  // Client-side state (only used when NOT server-paginated)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [search, setSearch] = useState('');

  // Client-side search
  const filteredRows = useMemo(() => {
    if (isServerPaginated || !search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      columns.some((col) => {
        if (col.searchable === false) return false;
        const value = (row as Record<string, unknown>)[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(q);
      }),
    );
  }, [rows, search, columns, isServerPaginated]);

  // Pagination values
  const currentPage = isServerPaginated ? pagination!.page - 1 : page;
  const currentPerPage = isServerPaginated ? pagination!.perPage : rowsPerPage;
  const totalCount = isServerPaginated ? pagination!.total : filteredRows.length;
  const visibleRows = isServerPaginated
    ? rows
    : currentPerPage > 0
      ? filteredRows.slice(currentPage * currentPerPage, currentPage * currentPerPage + currentPerPage)
      : filteredRows;

  // Selection
  const selectedSet = useMemo(() => new Set(selected ?? []), [selected]);
  const visibleIds = useMemo(() => visibleRows.map(getRowId), [visibleRows, getRowId]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedSet.has(id));

  const handleToggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allVisibleSelected) {
      onSelectionChange((selected ?? []).filter((id) => !visibleIds.includes(id)));
    } else {
      onSelectionChange([...new Set([...(selected ?? []), ...visibleIds])]);
    }
  }, [allVisibleSelected, onSelectionChange, selected, visibleIds]);

  const handleToggleRow = useCallback((id: string) => {
    if (!onSelectionChange) return;
    if (selectedSet.has(id)) {
      onSelectionChange((selected ?? []).filter((s) => s !== id));
    } else {
      onSelectionChange([...(selected ?? []), id]);
    }
  }, [onSelectionChange, selected, selectedSet]);

  const handlePageChange = isServerPaginated
    ? (_: unknown, newPage: number) => pagination!.onPageChange(newPage + 1)
    : (_: unknown, newPage: number) => setPage(newPage);

  const handlePerPageChange = isServerPaginated
    ? (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => pagination!.onPerPageChange(parseInt(e.target.value, 10))
    : (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      };

  const effectiveRowsPerPageOptions = isServerPaginated
    ? (pagination!.perPageOptions ?? [10, 25, 50, 100])
    : rowsPerPageOptions;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }} variant="outlined">
      {/* ── Toolbar ── */}
      {(showSearch || toolbarExtra) && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {showSearch && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 240 }}
            />
          )}
          {toolbarExtra}
        </Box>
      )}

      {/* ── Table ── */}
      <TableContainer sx={{ maxHeight }}>
        <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid', borderColor: 'divider' } }}>
          <TableHead>
            <TableRow>
              {isSelectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someVisibleSelected && !allVisibleSelected}
                    checked={allVisibleSelected}
                    onChange={handleToggleAll}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align ?? 'left'} style={{ minWidth: col.minWidth, width: col.width }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: currentPerPage || 5 }).map((_, i) => (
                <TableRow key={i}>
                  {isSelectable && <TableCell padding="checkbox"><Skeleton variant="circular" width={16} height={16} /></TableCell>}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton variant="text" width="80%" height={16} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (isSelectable ? 1 : 0)} sx={{ border: 0, py: 8 }}>
                  <EmptyState title={emptyTitle ?? ''} description={emptyDescription ?? ''} action={emptyAction} />
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const id = getRowId(row);
                return (
                  <TableRow
                    key={id}
                    hover
                    selected={isSelectable && selectedSet.has(id)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {isSelectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedSet.has(id)}
                          onChange={() => handleToggleRow(id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {columns.map((col, colIndex) => {
                      const value = (row as Record<string, unknown>)[col.key];
                      return (
                        <TableCell
                          key={col.key}
                          component={colIndex === 0 ? 'th' : 'td'}
                          scope={colIndex === 0 ? 'row' : undefined}
                          align={col.align ?? 'left'}
                        >
                          {col.render
                            ? col.render(row, value)
                            : value != null
                              ? String(value)
                              : '—'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      <TablePagination
        rowsPerPageOptions={effectiveRowsPerPageOptions}
        component="div"
        count={totalCount}
        rowsPerPage={currentPerPage}
        page={currentPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handlePerPageChange}
      />
    </Paper>
  );
}
