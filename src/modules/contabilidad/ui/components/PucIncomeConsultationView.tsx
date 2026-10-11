import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Landmark, Printer } from 'lucide-react';
import { httpClient } from '../../../../shared/infrastructure/http/httpClient';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, normalizeText, todayISO } from '../../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../../shared/ui/components/SearchFilterBar';
import { FormField, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../../shared/ui/components/Modal';
import { PrintDocumentLayout, usePrintDocument } from '../../../../shared/ui/components/PrintDocumentLayout';

interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: 'DEBIT' | 'CREDIT';
  initialBalance: number;
  periodDebit: number;
  periodCredit: number;
  finalBalance: number;
}

interface LedgerEntry {
  date: string;
  voucherNumber: string;
  referenceNumber?: string;
  thirdPartyName?: string;
  description?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

interface Ledger {
  accountCode: string;
  accountName: string;
  initialBalance: number;
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
  entries: LedgerEntry[];
}

const CLASS_LABELS: Record<string, string> = {
  '1': 'Activo',
  '2': 'Pasivo',
  '3': 'Patrimonio',
  '4': 'Ingresos',
  '5': 'Gastos',
  '6': 'Costos',
};

interface Props {
  onNavigateToPucCatalog?: () => void;
}

/**
 * Saldos y movimientos por cuenta PUC tomados del balance de prueba contable (asientos contabilizados).
 * No recalcula nada en el navegador: lo que se ve aquí es lo mismo que reportan los estados financieros.
 */
export const PucIncomeConsultationView: React.FC<Props> = ({ onNavigateToPucCatalog }) => {
  const [from, setFrom] = useState(`${todayISO().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(todayISO());
  const [items, setItems] = useState<TrialBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pucClass, setPucClass] = useState('');
  const [onlyMovement, setOnlyMovement] = useState(true);
  const [ledgerFor, setLedgerFor] = useState<TrialBalanceItem | null>(null);
  const { documentId, print } = usePrintDocument();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await httpClient.get<{ items: TrialBalanceItem[] }>('/reports/trial-balance', { params: { startDate: from, endDate: to } });
      setItems(res.data.items ?? []);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar el balance por cuentas.'));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const q = normalizeText(search);
    return items
      .filter((i) => !pucClass || i.accountCode.startsWith(pucClass))
      .filter((i) => !onlyMovement || Number(i.periodDebit) !== 0 || Number(i.periodCredit) !== 0 || Number(i.finalBalance) !== 0)
      .filter((i) => !q || normalizeText(`${i.accountCode} ${i.accountName}`).includes(q))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }, [items, search, pucClass, onlyMovement]);

  const sumPrefix = (prefix: string) =>
    items.filter((i) => i.accountCode.startsWith(prefix)).reduce((s, i) => s + Number(i.finalBalance), 0);
  const income = items.filter((i) => i.accountCode.startsWith('4')).reduce((s, i) => s + Number(i.periodCredit) - Number(i.periodDebit), 0);

  const groups = useMemo(() => {
    const map = new Map<string, TrialBalanceItem[]>();
    rows.forEach((r) => {
      const k = r.accountCode.charAt(0);
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return [...map.entries()];
  }, [rows]);

  const totals = rows.reduce(
    (t, r) => ({ debit: t.debit + Number(r.periodDebit), credit: t.credit + Number(r.periodCredit) }),
    { debit: 0, credit: 0 }
  );

  const table = (printable: boolean) => (
    <table className={printable ? undefined : 'w-full min-w-[760px] border-collapse text-sm'}>
      <thead className={printable ? undefined : 'sticky top-0 bg-slate-800 text-white'}>
        <tr>
          <th className={printable ? undefined : 'px-3 py-2.5 text-left text-[11px] font-bold uppercase'}>Código PUC</th>
          <th className={printable ? undefined : 'px-3 py-2.5 text-left text-[11px] font-bold uppercase'}>Nombre de cuenta</th>
          <th className={printable ? 'num' : 'px-3 py-2.5 text-right text-[11px] font-bold uppercase'}>Saldo inicial</th>
          <th className={printable ? 'num' : 'px-3 py-2.5 text-right text-[11px] font-bold uppercase'}>Débito</th>
          <th className={printable ? 'num' : 'px-3 py-2.5 text-right text-[11px] font-bold uppercase'}>Crédito</th>
          <th className={printable ? 'num' : 'px-3 py-2.5 text-right text-[11px] font-bold uppercase'}>Saldo</th>
        </tr>
      </thead>
      <tbody>
        {groups.map(([cls, list]) => (
          <React.Fragment key={cls}>
            <tr className={printable ? 'row-group' : 'bg-slate-100'}>
              <td colSpan={6} className={printable ? undefined : 'px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700'}>
                Clase {cls} · {CLASS_LABELS[cls] ?? ''}
              </td>
            </tr>
            {list.map((r) => (
              <tr
                key={r.accountId}
                onClick={printable ? undefined : () => setLedgerFor(r)}
                className={printable ? undefined : 'cursor-pointer border-b border-slate-100 hover:bg-indigo-50/40'}
                title={printable ? undefined : 'Ver movimientos'}
              >
                <td className={printable ? undefined : 'whitespace-nowrap px-3 py-2 font-mono text-xs font-bold text-slate-900'}>{r.accountCode}</td>
                <td className={printable ? undefined : 'px-3 py-2 text-slate-800'}>{r.accountName}</td>
                <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600'}>{formatCOP(r.initialBalance, '$0')}</td>
                <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2 text-right tabular-nums'}>{formatCOP(r.periodDebit, '$0')}</td>
                <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2 text-right tabular-nums'}>{formatCOP(r.periodCredit, '$0')}</td>
                <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums text-slate-900'}>{formatCOP(r.finalBalance, '$0')}</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
        {rows.length > 0 && (
          <tr className={printable ? 'row-total' : 'bg-slate-900 font-bold text-white'}>
            <td colSpan={3} className={printable ? undefined : 'px-3 py-2.5 text-xs uppercase'}>
              Totales del periodo
            </td>
            <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2.5 text-right tabular-nums'}>{formatCOP(totals.debit, '$0')}</td>
            <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2.5 text-right tabular-nums'}>{formatCOP(totals.credit, '$0')}</td>
            <td />
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Ingresos y saldos por cuenta PUC"
        subtitle="Movimientos contabilizados del periodo por cuenta. Haga clic en una cuenta para ver su detalle."
        icon={<Landmark size={20} />}
        actions={
          <>
            {onNavigateToPucCatalog && (
              <button type="button" className={buttonClass.secondary} onClick={onNavigateToPucCatalog}>
                Plan de cuentas
              </button>
            )}
            <button type="button" className={buttonClass.secondary} onClick={print} disabled={rows.length === 0}>
              <Printer size={16} /> Imprimir
            </button>
          </>
        }
      />
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Caja y bancos (11)" value={formatCOP(sumPrefix('11'), '$0')} tone="primary" />
        <StatCard label="Ingresos del periodo (4)" value={formatCOP(income, '$0')} tone="positive" />
        <StatCard label="Aportes sociales (3115)" value={formatCOP(sumPrefix('3115'), '$0')} />
        <StatCard label="Fondos sociales (2380)" value={formatCOP(sumPrefix('2380'), '$0')} />
        <StatCard label="Cartera préstamos (1365)" value={formatCOP(sumPrefix('1365'), '$0')} />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por código o nombre de cuenta…"
        activeFilters={(pucClass ? 1 : 0) + (onlyMovement ? 0 : 1)}
        onClear={() => {
          setPucClass('');
          setOnlyMovement(true);
        }}
      >
        <FormField label="Desde">
          <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="Hasta">
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
        <FormField label="Clase PUC">
          <select className={selectClass} value={pucClass} onChange={(e) => setPucClass(e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(CLASS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {k} - {v}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Cuentas">
          <select className={selectClass} value={onlyMovement ? 'mov' : 'all'} onChange={(e) => setOnlyMovement(e.target.value === 'mov')}>
            <option value="mov">Solo con saldo o movimiento</option>
            <option value="all">Todas</option>
          </select>
        </FormField>
      </SearchFilterBar>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">No hay cuentas con movimiento en el periodo.</p>
      ) : (
        <>
          {/* Escritorio / tablet: tabla con scroll interno */}
          <div className="table-scroll hidden rounded-xl border border-slate-200 bg-white md:block">{table(false)}</div>
          {/* Celular: tarjetas por cuenta */}
          <ul className="flex flex-col gap-3 md:hidden">
            {rows.map((r) => (
              <li key={r.accountId}>
                <button
                  type="button"
                  onClick={() => setLedgerFor(r)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs active:bg-slate-50 cursor-pointer"
                >
                  <p className="text-sm font-bold text-slate-900">
                    <span className="font-mono">{r.accountCode}</span> - {r.accountName}
                  </p>
                  <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-900">{formatCOP(r.finalBalance, '$0')}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <span>Débito {formatCOP(r.periodDebit, '$0')}</span>
                    <span className="text-right">Crédito {formatCOP(r.periodCredit, '$0')}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <PrintDocumentLayout
        documentId={documentId}
        title="Saldos por cuenta PUC"
        meta={[
          { label: 'Periodo', value: `${formatDate(from)} - ${formatDate(to)}` },
          { label: 'Clase', value: pucClass ? `${pucClass} - ${CLASS_LABELS[pucClass]}` : 'Todas' },
          { label: 'Cuentas', value: rows.length },
        ]}
      >
        {table(true)}
      </PrintDocumentLayout>

      <LedgerModal account={ledgerFor} from={from} to={to} onClose={() => setLedgerFor(null)} />
    </PageContainer>
  );
};

const LedgerModal: React.FC<{ account: TrialBalanceItem | null; from: string; to: string; onClose: () => void }> = ({ account, from, to, onClose }) => {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLedger(null);
    setError(null);
    if (!account) return;
    httpClient
      .get<Ledger>('/reports/general-ledger', { params: { accountCode: account.accountCode, startDate: from, endDate: to } })
      .then((r) => setLedger(r.data))
      .catch((e) => setError(apiErrorMessage(e, 'No se pudo cargar el detalle de la cuenta.')));
  }, [account, from, to]);

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      size="xl"
      title={account ? `${account.accountCode} - ${account.accountName}` : ''}
      subtitle={`Movimientos del ${formatDate(from)} al ${formatDate(to)}`}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {!ledger && !error && <p className="py-8 text-center text-sm text-slate-500">Cargando…</p>}
      {ledger && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <StatCard label="Saldo inicial" value={formatCOP(ledger.initialBalance, '$0')} />
            <StatCard label="Débitos" value={formatCOP(ledger.totalDebit, '$0')} />
            <StatCard label="Créditos" value={formatCOP(ledger.totalCredit, '$0')} />
            <StatCard label="Saldo final" value={formatCOP(ledger.finalBalance, '$0')} tone="primary" />
          </div>
          <div className="table-scroll rounded-lg border border-slate-200">
            <table className="table-stack w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Comprobante</th>
                  <th className="px-3 py-2 text-left">Tercero</th>
                  <th className="px-3 py-2 text-left">Detalle</th>
                  <th className="px-3 py-2 text-right">Débito</th>
                  <th className="px-3 py-2 text-right">Crédito</th>
                  <th className="px-3 py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {ledger.entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                      Sin movimientos en el periodo.
                    </td>
                  </tr>
                ) : (
                  ledger.entries.map((e, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="whitespace-nowrap px-3 py-2">{formatDate(e.date)}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{e.voucherNumber}</td>
                      <td className="px-3 py-2 text-xs">{e.thirdPartyName ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{e.description ?? ''}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{Number(e.debit) > 0 ? formatCOP(e.debit) : ''}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">{Number(e.credit) > 0 ? formatCOP(e.credit) : ''}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">{formatCOP(e.runningBalance, '$0')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};
