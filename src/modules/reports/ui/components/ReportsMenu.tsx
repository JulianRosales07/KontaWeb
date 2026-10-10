import React, { useMemo, useState } from 'react';
import {
  BookOpenCheck,
  Building2,
  ChevronDown,
  HandCoins,
  LayoutDashboard,
  Landmark,
  PiggyBank,
  Receipt,
  Search,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { normalizeText } from '../../../../shared/lib/format';

export interface ReportsMenuItem {
  code: string;
  title: string;
  description: string;
  group: string;
  sheet?: string;
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  Inicio: <LayoutDashboard size={15} />,
  'Estados financieros': <BookOpenCheck size={15} />,
  'Recaudos y asociados': <Receipt size={15} />,
  Cartera: <HandCoins size={15} />,
  'Fondos y actividades': <PiggyBank size={15} />,
  Tesorería: <Landmark size={15} />,
  Activos: <Building2 size={15} />,
  'Ingresos y gastos': <Wallet size={15} />,
  Herramientas: <Upload size={15} />,
};

const STORAGE_KEY = 'konta_reports_menu_collapsed';

const readCollapsed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
};

/**
 * Menú lateral del centro de reportes: buscador, grupos plegables con ícono y conteo, y marca de los reportes
 * que equivalen a una hoja del informe mensual en Excel. Queda fijo y con scroll propio.
 */
export const ReportsMenu: React.FC<{ items: ReportsMenuItem[]; current: string; onSelect: (code: string) => void }> = ({
  items,
  current,
  onSelect,
}) => {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<string[]>(readCollapsed);

  const toggle = (group: string) => {
    const next = collapsed.includes(group) ? collapsed.filter((g) => g !== group) : [...collapsed, group];
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // preferencia opcional
    }
  };

  const q = normalizeText(query);
  const filtered = useMemo(
    () => (q ? items.filter((i) => normalizeText(`${i.title} ${i.description} ${i.sheet ?? ''}`).includes(q)) : items),
    [items, q],
  );
  const groups = [...new Set(filtered.map((i) => i.group))];

  return (
    <nav
      aria-label="Reportes"
      className="sticky top-4 hidden max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs lg:flex"
    >
      <div className="border-b border-slate-100 p-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar reporte…"
            aria-label="Buscar reporte"
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {groups.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-500">Sin resultados para “{query}”.</p>}
        {groups.map((g) => {
          const list = filtered.filter((i) => i.group === g);
          const open = !!q || !collapsed.includes(g) || list.some((i) => i.code === current);
          const single = list.length === 1 && (g === 'Inicio' || g === 'Herramientas');
          if (single) {
            const i = list[0];
            return <MenuButton key={g} item={i} active={current === i.code} onSelect={onSelect} icon={GROUP_ICONS[g]} topLevel />;
          }
          return (
            <div key={g} className="mt-1 first:mt-0">
              <button
                type="button"
                onClick={() => toggle(g)}
                aria-expanded={open}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              >
                <span className="text-slate-400">{GROUP_ICONS[g]}</span>
                <span className="min-w-0 flex-1 truncate">{g}</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{list.length}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
              </button>
              {open && (
                <div className="mb-1 ml-[18px] flex flex-col gap-0.5 border-l border-slate-100 pl-2">
                  {list.map((i) => (
                    <MenuButton key={i.code} item={i} active={current === i.code} onSelect={onSelect} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
        <span className="size-2 rounded-full bg-emerald-500" /> Equivale a una hoja del informe en Excel
      </div>
    </nav>
  );
};

const MenuButton: React.FC<{
  item: ReportsMenuItem;
  active: boolean;
  onSelect: (code: string) => void;
  icon?: React.ReactNode;
  topLevel?: boolean;
}> = ({ item, active, onSelect, icon, topLevel }) => (
  <button
    type="button"
    onClick={() => onSelect(item.code)}
    aria-current={active ? 'page' : undefined}
    title={item.description}
    className={`group relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-left text-[13px] transition-colors ${
      topLevel ? 'py-2 font-semibold' : 'py-1.5'
    } ${active ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
  >
    {active && !topLevel && <span className="absolute -left-[9px] top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-600" />}
    {icon && <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>}
    <span className="min-w-0 flex-1 leading-snug">{item.title}</span>
    {item.sheet && (
      <span
        className={`size-1.5 shrink-0 rounded-full ${active ? 'bg-indigo-500' : 'bg-emerald-500'}`}
        title={`Equivale a la hoja ${item.sheet} del informe mensual`}
        aria-label={`Hoja de Excel: ${item.sheet}`}
      />
    )}
  </button>
);
