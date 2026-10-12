import React from 'react';
import { Table } from '@/components/ui/heroui-table';
import { EmptyState } from '@heroui/react';
import { Inbox, Loader2 } from 'lucide-react';
import { TablePagination, usePagedRows } from './TablePagination';

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Clases extra para th/td (p. ej. anchos mínimos). */
  className?: string;
  /** No mostrar en la vista de tarjetas móvil. */
  hideOnMobile?: boolean;
  /** Etiqueta en la tarjeta móvil (por defecto el header). */
  mobileLabel?: string;
}

export interface ResponsiveTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** cards: en móvil (<768px) cada fila es una tarjeta. scroll: la tabla hace scroll horizontal interno. */
  mobileMode?: 'cards' | 'scroll';
  /** Título de la tarjeta móvil. */
  cardTitle?: (row: T) => React.ReactNode;
  /** Acciones al pie de cada tarjeta móvil. */
  cardActions?: (row: T) => React.ReactNode;
  emptyMessage?: React.ReactNode;
  loading?: boolean;
  footer?: React.ReactNode;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  dense?: boolean;
  minWidth?: number;
  /** Filas por página (paginación en el cliente). 0 la desactiva, p. ej. si el servidor ya pagina. */
  pageSize?: number;
}

const alignClass = (a?: 'left' | 'right' | 'center') =>
  a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

/**
 * Tabla responsive moderna construida con HeroUI Table:
 * - ScrollContainer interno con anchos adaptables
 * - EmptyState nativo con diseño limpio e ícono Inbox
 * - Modo tarjetas para móvil y tabla en escritorio
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  mobileMode = 'cards',
  cardTitle,
  cardActions,
  emptyMessage = 'No hay registros para mostrar.',
  loading,
  footer,
  onRowClick,
  rowClassName,
  dense,
  minWidth = 720,
  pageSize = 25,
}: ResponsiveTableProps<T>) {
  const cell = dense ? 'px-3 py-2' : 'px-4 py-3';
  const paged = usePagedRows(rows, pageSize);
  const pageRows = paged.pageRows;
  const pagination = !loading && <TablePagination {...paged} />;

  const table = (
    <Table className="w-full min-h-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Tabla de datos"
          className="h-full w-full text-sm"
          style={{ minWidth }}
        >
          <Table.Header className="bg-slate-50/80 border-b border-slate-200">
            {columns.map((c, idx) => (
              <Table.Column
                key={c.key}
                isRowHeader={idx === 0}
                className={`${cell} whitespace-nowrap text-[11px] font-bold uppercase tracking-wider text-slate-500 ${alignClass(c.align)} ${c.className ?? ''}`}
              >
                {c.header}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-3 py-12 text-center">
                {loading ? (
                  <>
                    <Loader2 className="size-6 animate-spin text-slate-500" />
                    <span className="text-sm font-medium text-slate-500">Cargando registros…</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <Inbox className="size-6" />
                    </div>
                    <span className="text-sm font-medium text-slate-500">{emptyMessage}</span>
                  </>
                )}
              </EmptyState>
            )}
          >
            {loading ? [] : pageRows.map((row, i) => (
              <Table.Row
                key={rowKey(row, i)}
                id={rowKey(row, i)}
                onAction={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-100 transition-colors last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/30'} ${rowClassName?.(row) ?? ''}`}
              >
                {columns.map((c) => (
                  <Table.Cell
                    key={c.key}
                    className={`${cell} align-middle text-slate-700 ${alignClass(c.align)} ${c.align === 'right' ? 'tabular-nums whitespace-nowrap' : ''} ${c.className ?? ''}`}
                  >
                    {c.render ? c.render(row, i) : ((row as Record<string, unknown>)[c.key] as React.ReactNode)}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
      {footer && !loading && rows.length > 0 && (
        <Table.Footer className="border-t border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
          {footer}
        </Table.Footer>
      )}
    </Table>
  );

  if (mobileMode === 'scroll')
    return (
      <div className="flex min-w-0 flex-col gap-3">
        {table}
        {pagination}
      </div>
    );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="hidden md:block">{table}</div>
      <div className="md:hidden">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin text-slate-400" />
            <span>Cargando…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Inbox className="size-6" />
            </div>
            <span>{emptyMessage}</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {pageRows.map((row, i) => (
              <li
                key={rowKey(row, i)}
                className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs ${onRowClick ? 'cursor-pointer active:bg-slate-50' : ''} ${rowClassName?.(row) ?? ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {cardTitle && <div className="mb-2 min-w-0 text-sm font-bold text-slate-900">{cardTitle(row)}</div>}
                <dl className="grid grid-cols-1 gap-1.5">
                  {columns
                    .filter((c) => !c.hideOnMobile)
                    .map((c) => (
                      <div key={c.key} className="flex min-w-0 items-start justify-between gap-3 text-sm">
                        <dt className="shrink-0 text-xs font-medium text-slate-500">
                          {c.mobileLabel ?? (typeof c.header === 'string' ? c.header : '')}
                        </dt>
                        <dd className={`min-w-0 text-right text-slate-800 ${c.align === 'right' ? 'tabular-nums' : 'break-words'}`}>
                          {c.render ? c.render(row, i) : ((row as Record<string, unknown>)[c.key] as React.ReactNode)}
                        </dd>
                      </div>
                    ))}
                </dl>
                {cardActions && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    {cardActions(row)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {footer && rows.length > 0 && !loading && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            {footer}
          </div>
        )}
      </div>
      {pagination}
    </div>
  );
}
