import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X } from 'lucide-react';
import { normalizeText } from '../../lib/format';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface PagedRows<T> {
  pageRows: T[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

/**
 * Paginación en el cliente. `pageSize <= 0` desactiva la paginación (devuelve todas las filas).
 * Vuelve a la primera página cuando cambia la cantidad de filas (p. ej. al buscar o filtrar).
 */
export function usePagedRows<T>(rows: T[], initialPageSize = 25): PagedRows<T> {
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [page, setPage] = useState(0);
  const enabled = pageSize > 0;
  const total = rows.length;
  const pageCount = enabled ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  useEffect(() => setPage(0), [total]);

  const current = Math.min(page, pageCount - 1);
  const pageRows = useMemo(
    () => (enabled ? rows.slice(current * pageSize, current * pageSize + pageSize) : rows),
    [rows, enabled, current, pageSize],
  );

  return {
    pageRows,
    page: current,
    pageCount,
    pageSize,
    total,
    setPage: (p) => setPage(Math.max(0, Math.min(p, pageCount - 1))),
    setPageSize: (size) => {
      setPageSizeState(size);
      setPage(0);
    },
  };
}

/** Filtra filas por texto libre (sin tildes ni mayúsculas). `toText` arma el texto buscable de cada fila. */
export function useTableSearch<T>(rows: T[], toText: (row: T) => string) {
  const [query, setQuery] = useState('');
  const q = normalizeText(query.trim());
  const filtered = useMemo(
    () => (q ? rows.filter((r) => normalizeText(toText(r)).includes(q)) : rows),
    // toText suele ser una función en línea; la búsqueda depende de las filas y del texto escrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, q],
  );
  return { query, setQuery, filtered };
}

/** Páginas visibles: primera, última y vecinas de la actual, con "…" entre saltos. */
function pageWindow(page: number, count: number): (number | '…')[] {
  const pages = new Set([0, count - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

const navBase = 'flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm disabled:cursor-default disabled:opacity-40 cursor-pointer';
const navBtn = `${navBase} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`;
const navBtnActive = `${navBase} border-slate-900 bg-slate-900 font-semibold text-white`;

/** Barra de paginación: "Mostrando X–Y de Z", filas por página y navegación. En celular se compacta. */
export const TablePagination: React.FC<
  Omit<PagedRows<unknown>, 'pageRows'> & { pageSizeOptions?: number[]; itemLabel?: string }
> = ({ page, pageCount, pageSize, total, setPage, setPageSize, pageSizeOptions = PAGE_SIZE_OPTIONS, itemLabel = 'registros' }) => {
  if (total === 0 || pageSize <= 0) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, from + pageSize - 1);
  const showNav = pageCount > 1;
  if (!showNav && total <= Math.min(...pageSizeOptions)) return null;

  return (
    <nav aria-label="Paginación" className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-start">
        <span>
          Mostrando <strong className="font-semibold text-slate-900">{from}–{to}</strong> de{' '}
          <strong className="font-semibold text-slate-900">{total}</strong> {itemLabel}
        </span>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Filas por página
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showNav && (
        <div className="flex items-center justify-center gap-1">
          <button type="button" className={`${navBtn} hidden sm:flex`} onClick={() => setPage(0)} disabled={page === 0} aria-label="Primera página">
            <ChevronsLeft size={16} />
          </button>
          <button type="button" className={navBtn} onClick={() => setPage(page - 1)} disabled={page === 0} aria-label="Página anterior">
            <ChevronLeft size={16} />
          </button>
          {/* Celular: indicador compacto */}
          <span className="px-3 text-sm font-semibold text-slate-800 sm:hidden">
            {page + 1} / {pageCount}
          </span>
          {/* Escritorio: números de página */}
          <span className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, pageCount).map((p, i) =>
              p === '…' ? (
                <span key={`gap-${i}`} className="px-1 text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-current={p === page ? 'page' : undefined}
                  className={p === page ? navBtnActive : navBtn}
                >
                  {p + 1}
                </button>
              ),
            )}
          </span>
          <button type="button" className={navBtn} onClick={() => setPage(page + 1)} disabled={page >= pageCount - 1} aria-label="Página siguiente">
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className={`${navBtn} hidden sm:flex`}
            onClick={() => setPage(pageCount - 1)}
            disabled={page >= pageCount - 1}
            aria-label="Última página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </nav>
  );
};

/** Campo de búsqueda compacto para colocar sobre una tabla. */
export const TableSearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Buscar en la tabla…', className = '' }) => (
  <div className={`relative min-w-0 ${className}`}>
    <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-9 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
        aria-label="Limpiar búsqueda"
      >
        <X size={14} />
      </button>
    )}
  </div>
);
