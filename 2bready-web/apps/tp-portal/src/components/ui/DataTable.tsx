'use client';

import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import EmptyState from './EmptyState';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTablePagination {
  // 1-indexed, matching Laravel's paginator — converted to/from MUI's
  // 0-indexed TablePagination internally, never leaked to the caller.
  page: number;
  perPage: number;
  total: number;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  // Omit entirely for pages that don't need it (most callers today) — server-side
  // only, this never slices `rows` itself, it just renders controls and reports
  // the requested page/perPage back to the caller's own data-fetching effect.
  pagination?: DataTablePagination;
}

export default function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowClick,
  pagination,
}: DataTableProps<T>) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} align={col.align ?? 'left'} width={col.width}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton variant="text" width="80%" height={16} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ border: 0, p: 0 }}>
                <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align ?? 'left'}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination && rows.length > 0 && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.perPage}
          rowsPerPageOptions={pagination.perPageOptions ?? [10, 25, 50, 100]}
          onPageChange={(_, newPage) => pagination.onPageChange(newPage + 1)}
          onRowsPerPageChange={(e) => pagination.onPerPageChange(Number(e.target.value))}
        />
      )}
    </TableContainer>
  );
}
