import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, PiggyBank } from 'lucide-react';
import { directoryApi, type AssociateSummary } from '../../infrastructure/directoryApi';
import { reportApi } from '../../../reports/api/reportApi';
import { useAuth } from '../../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, normalizeText, todayISO } from '../../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../../shared/ui/components/ResponsiveTable';
import { FormField, selectClass } from '../../../../shared/ui/components/MoneyInput';

/** Cuentas por pagar: aportes y ahorros acumulados a favor de cada asociado (siempre separados). */
export const PayablesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState<AssociateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [concept, setConcept] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await directoryApi.payables());
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron cargar las cuentas por pagar.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return rows.filter(
      (r) =>
        (!concept || (concept === 'APORTES' ? r.contributions > 0 : r.savings > 0)) &&
        (!q || normalizeText(`${r.fullName} ${r.identificationNumber} ${r.associateCode ?? ''}`).includes(q))
    );
  }, [rows, search, concept]);

  const totals = {
    contributions: filtered.reduce((s, r) => s + r.contributions, 0),
    savings: filtered.reduce((s, r) => s + r.savings, 0),
  };

  const exportReport = async (format: 'pdf' | 'xlsx') => {
    setExporting(true);
    try {
      await reportApi.download('CUENTAS_POR_PAGAR', format, { from: todayISO(), to: todayISO() });
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo exportar.'));
    } finally {
      setExporting(false);
    }
  };

  const columns: TableColumn<AssociateSummary>[] = [
    { key: 'name', header: 'Nombre', hideOnMobile: true, render: (r) => <span className="font-semibold text-slate-900">{r.fullName}</span> },
    { key: 'doc', header: 'Documento', render: (r) => r.identificationNumber },
    { key: 'contributions', header: 'Aportes acumulados', align: 'right', render: (r) => formatCOP(r.contributions, '$0') },
    { key: 'savings', header: 'Ahorros acumulados', align: 'right', render: (r) => formatCOP(r.savings, '$0') },
    { key: 'movements', header: 'Movimientos', align: 'right', render: (r) => r.movements },
    { key: 'balance', header: 'Saldo', align: 'right', render: (r) => <strong className="text-slate-900">{formatCOP(r.payableBalance, '$0')}</strong> },
    { key: 'last', header: 'Última actualización', render: (r) => formatDate(r.lastMovementDate) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Cuentas por pagar"
        subtitle="Aportes y ahorros de los asociados. Ambos conceptos se presentan por separado."
        icon={<PiggyBank size={20} />}
        actions={
          hasPermission('REPORTS_EXPORT') && (
            <>
              <button type="button" className={buttonClass.secondary} onClick={() => exportReport('pdf')} disabled={exporting}>
                <FileDown size={16} /> PDF
              </button>
              <button type="button" className={buttonClass.secondary} onClick={() => exportReport('xlsx')} disabled={exporting}>
                <FileSpreadsheet size={16} /> Excel
              </button>
            </>
          )
        }
      />
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Aportes" value={formatCOP(totals.contributions, '$0')} tone="primary" />
        <StatCard label="Ahorros" value={formatCOP(totals.savings, '$0')} tone="primary" />
        <StatCard label="Total por pagar" value={formatCOP(totals.contributions + totals.savings, '$0')} tone="negative" />
        <StatCard label="Asociados" value={filtered.length} />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por nombre, documento o código…"
        activeFilters={concept ? 1 : 0}
        onClear={() => setConcept('')}
      >
        <FormField label="Concepto">
          <select className={selectClass} value={concept} onChange={(e) => setConcept(e.target.value)}>
            <option value="">Aportes y ahorros</option>
            <option value="APORTES">Con aportes</option>
            <option value="AHORROS">Con ahorros</option>
          </select>
        </FormField>
      </SearchFilterBar>

      <ResponsiveTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        loading={loading}
        cardTitle={(r) => r.fullName}
        footer={
          <tr>
            <td className="px-4 py-3 text-xs font-bold uppercase" colSpan={2}>
              Totales
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCOP(totals.contributions, '$0')}</td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCOP(totals.savings, '$0')}</td>
            <td />
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCOP(totals.contributions + totals.savings, '$0')}</td>
            <td />
          </tr>
        }
        emptyMessage="No hay aportes ni ahorros registrados."
      />
    </PageContainer>
  );
};
