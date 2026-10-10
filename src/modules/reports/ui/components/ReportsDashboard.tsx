import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { reportApi, type DashboardData } from '../../api/reportApi';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP } from '../../../../shared/lib/format';
import { Alert, StatCard } from '../../../../shared/ui/components/PageHeader';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(2, 4)}`;

/** Formato corto para ejes: $1,2 M / $350 mil. */
const compact = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1_000_000) return `$${(v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} M`;
  if (a >= 1_000) return `$${Math.round(v / 1_000).toLocaleString('es-CO')} mil`;
  return formatCOP(v, '$0');
};

/** Tablero: indicadores y gráficas calculados en el servidor desde los asientos contabilizados. */
export const ReportsDashboard: React.FC<{ to: string; onOpenReport: (code: string) => void }> = ({ to, onOpenReport }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    reportApi
      .dashboard(undefined, to)
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e, 'No se pudo cargar el tablero.')));
  }, [to]);

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!data) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <Loader2 className="size-5 animate-spin" /> Calculando indicadores…
      </div>
    );
  }
  const k = data.kpis;
  const card = (label: string, value: number, code: string, tone: 'neutral' | 'positive' | 'negative' | 'primary' = 'neutral') => (
    <button type="button" className="min-w-0 cursor-pointer text-left" onClick={() => onOpenReport(code)} title="Abrir el reporte">
      <StatCard label={label} value={formatCOP(value, '$0')} tone={tone} />
    </button>
  );

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {card('Total activos', k.assets, 'ESTADO_SITUACION', 'primary')}
        {card('Total pasivos', k.liabilities, 'ESTADO_SITUACION', 'negative')}
        {card('Patrimonio', k.equity, 'ESTADO_SITUACION', 'positive')}
        {card(k.result >= 0 ? 'Excedente del año' : 'Déficit del año', k.result, 'ESTADO_RESULTADOS', k.result >= 0 ? 'positive' : 'negative')}
        {card('Caja', k.cash, 'CAJA')}
        {card('Bancos', k.banks, 'BANCOS')}
        {card('Inversiones', k.investments, 'INVERSIONES')}
        {card('Cuentas por cobrar', k.receivables, 'CXC_ASOCIADOS')}
        {card('Aportes sociales', k.contributions, 'APORTES_SOCIALES')}
        {card('Aportes extraordinarios', k.extraContributions, 'APORTES_EXTRAS')}
        {card('Fondo de solidaridad', k.solidarityFund, 'FONDO_SOLIDARIDAD')}
        {card('Turismo y recreación', k.tourismFund, 'TURISMO_RECREACION')}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Ingresos vs. gastos por mes">
          <MonthlyBars data={data.monthly} />
        </Panel>
        <Panel title="Recaudos de asociados por mes">
          <SingleBars data={data.monthly.map((m) => ({ label: monthLabel(m.month), value: m.collections }))} color="bg-indigo-500" />
        </Panel>
        <Panel title="Composición de ingresos del año">
          <Composition items={data.incomeComposition} color="bg-emerald-500" />
        </Panel>
        <Panel title="Composición de gastos del año">
          <Composition items={data.expenseComposition} color="bg-rose-500" />
        </Panel>
      </div>
    </section>
  );
};

const Panel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="mb-3 text-sm font-bold text-slate-800">{title}</h3>
    {children}
  </div>
);

const Empty = () => <p className="py-8 text-center text-sm text-slate-500">Sin movimientos en el periodo.</p>;

/** Barras agrupadas ingresos/gastos con eje en pesos. */
const MonthlyBars: React.FC<{ data: DashboardData['monthly'] }> = ({ data }) => {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  if (data.every((d) => d.income === 0 && d.expenses === 0)) return <Empty />;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" /> Ingresos</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-500" /> Gastos</span>
      </div>
      <div>
        <div className="flex h-48 items-end gap-1 border-b border-slate-200 pb-1 sm:gap-2">
          {data.map((d) => (
            <div key={d.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="flex h-full w-full items-end justify-center gap-0.5">
                <div className="w-1/2 max-w-4 rounded-t bg-emerald-500" style={{ height: `${(d.income / max) * 100}%` }} title={`Ingresos ${formatCOP(d.income)}`} />
                <div className="w-1/2 max-w-4 rounded-t bg-rose-500" style={{ height: `${(d.expenses / max) * 100}%` }} title={`Gastos ${formatCOP(d.expenses)}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1 pt-1 sm:gap-2">
          {data.map((d) => (
            <span key={d.month} className="min-w-0 flex-1 truncate text-center text-[9px] text-slate-500 sm:text-[10px]">{monthLabel(d.month)}</span>
          ))}
        </div>
      </div>
      <p className="mt-1 text-right text-[11px] text-slate-400">Máximo: {compact(max)}</p>
    </div>
  );
};

const SingleBars: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({ data, color }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.every((d) => d.value === 0)) return <Empty />;
  return (
    <div>
      <div className="flex h-48 items-end gap-1 border-b border-slate-200 pb-1 sm:gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-0.5 hidden text-[9px] text-slate-500 sm:block">{d.value > 0 ? compact(d.value) : ''}</span>
            <div className={`w-3/5 max-w-6 rounded-t ${color}`} style={{ height: `${(d.value / max) * 85}%` }} title={formatCOP(d.value)} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 pt-1 sm:gap-2">
        {data.map((d) => (
          <span key={d.label} className="min-w-0 flex-1 truncate text-center text-[9px] text-slate-500 sm:text-[10px]">{d.label}</span>
        ))}
      </div>
    </div>
  );
};

/** Barras horizontales con participación porcentual. */
const Composition: React.FC<{ items: { code?: string; label: string; value: number }[]; color: string }> = ({ items, color }) => {
  const total = items.reduce((s, i) => s + Math.max(0, i.value), 0);
  if (total === 0) return <Empty />;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.slice(0, 8).map((i) => {
        const pct = (Math.max(0, i.value) / total) * 100;
        return (
          <li key={i.code ?? i.label} className="min-w-0">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-slate-700" title={i.label}>{i.code ? `${i.code} · ` : ''}{i.label}</span>
              <span className="shrink-0 tabular-nums text-slate-900">
                {formatCOP(i.value, '$0')} <span className="text-slate-500">({pct.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%)</span>
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};
