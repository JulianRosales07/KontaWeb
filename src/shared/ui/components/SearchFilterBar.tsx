import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  /** Controles de filtro (selects, fechas...). En móvil se pliegan tras el botón "Filtros". */
  children?: React.ReactNode;
  activeFilters?: number;
  onClear?: () => void;
  actions?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  search,
  onSearchChange,
  placeholder = 'Buscar…',
  children,
  activeFilters = 0,
  onClear,
  actions,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {children && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer lg:hidden"
              aria-expanded={open}
            >
              <SlidersHorizontal size={15} />
              Filtros
              {activeFilters > 0 && (
                <span className="rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">{activeFilters}</span>
              )}
            </button>
          )}
          {actions}
        </div>
      </div>
      {children && (
        <div className={`${open ? 'grid' : 'hidden'} grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4 xl:grid-cols-5`}>
          {children}
          {onClear && activeFilters > 0 && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={onClear}
                className="h-10 rounded-lg px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
