import React, { useEffect, useRef, useState } from 'react';
import { Search, X, User, HandCoins, Loader2 } from 'lucide-react';
import { directoryApi, type AssociateSummary } from '../../infrastructure/directoryApi';
import { formatCOP } from '../../../../shared/lib/format';

interface Props {
  value: AssociateSummary | null;
  onChange: (associate: AssociateSummary | null) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Muestra saldo de préstamos junto a cada resultado. */
  showLoans?: boolean;
}

/** Buscador de asociados (nombre, documento, correo, teléfono o código) contra el backend. */
export const AssociatePicker: React.FC<Props> = ({
  value,
  onChange,
  id,
  placeholder = 'Buscar asociado por nombre o documento…',
  disabled,
  showLoans,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssociateSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = setTimeout(() => {
      directoryApi
        .search({ q: query, associatesOnly: true, status: 'ACTIVE' })
        .then((r) => setResults(r.slice(0, 30)))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(handle);
  }, [query, open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (value) {
    return (
      <div className="flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            {value.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{value.fullName}</p>
            <p className="truncate text-xs text-slate-600 mt-0.5">
              {value.idType ? `${value.idType} ` : 'Doc. '}
              <span className="font-semibold">{value.identificationNumber}</span>
              {value.associateCode ? ` · Código: ${value.associateCode}` : ''}
              {value.activeLoans > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                  <HandCoins size={10} />
                  {value.activeLoans} préstamo(s) activo(s)
                </span>
              )}
            </p>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
            aria-label="Cambiar asociado"
          >
            <X size={14} />
            <span>Cambiar</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative w-full min-w-0">
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type="search"
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-xs transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin text-indigo-600" />
              <span>Buscando asociados…</span>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              <User size={24} className="mx-auto mb-1.5 text-slate-300" />
              <p className="font-medium text-slate-700">Sin resultados para "{query}"</p>
              <p className="text-xs text-slate-400 mt-0.5">Intenta buscar por nombres, apellidos o número de documento.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    onChange(a);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-indigo-50/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-indigo-100 text-slate-700 group-hover:text-indigo-700 font-bold text-xs transition-colors">
                      {a.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-950">
                        {a.fullName}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {a.idType ? `${a.idType} ` : 'Doc. '}
                        <span className="font-medium text-slate-700">{a.identificationNumber}</span>
                        {a.associateCode ? ` · Código: ${a.associateCode}` : ''}
                      </span>
                    </div>
                  </div>

                  {showLoans && (
                    <div className="shrink-0 text-right">
                      {a.activeLoans > 0 ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {a.activeLoans} préstamo(s)
                          </span>
                          <span className="text-xs font-bold tabular-nums text-slate-800 mt-0.5">
                            Saldo: {formatCOP(a.loansBalance)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sin préstamos activos</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
