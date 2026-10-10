import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, FileDown, FileSpreadsheet, Scale } from 'lucide-react';
import { loanApi, type Loan } from '../api/loanApi';
import { reportApi } from '../../reports/api/reportApi';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, normalizeText, todayISO } from '../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../shared/ui/components/ResponsiveTable';
import { StatusBadge } from '../../../shared/ui/components/StatusBadge';
import { FormField, selectClass } from '../../../shared/ui/components/MoneyInput';
import { LoanScheduleModal } from './LoanScheduleModal';
import { NewLoanPaymentModal } from './NewLoanPaymentModal';

/** Cuentas por cobrar: obligaciones de los asociados con la asociación (préstamos activos). */
export const ReceivablesView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLoans(await loanApi.list({ status: 'ACTIVE' }));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo cargar la cartera.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const q = normalizeText(search);
    return loans.filter(
      (l) => (!portfolio || l.portfolioStatus === portfolio) && (!q || normalizeText(`${l.thirdPartyName} ${l.thirdPartyIdNumber} ${l.loanNumber}`).includes(q))
    );
  }, [loans, search, portfolio]);

  const total = loans.reduce((s, l) => s + l.outstandingPrincipal, 0);
  const overdueLoans = loans.filter((l) => l.portfolioStatus === 'EN_MORA');
  const overdueBalance = overdueLoans.reduce((s, l) => s + l.outstandingPrincipal, 0);
  const overdueAmount = loans.reduce((s, l) => s + l.overdueAmount, 0);

  const exportReport = async (format: 'pdf' | 'xlsx') => {
    setExporting(true);
    try {
      await reportApi.download('CUENTAS_POR_COBRAR', format, { from: todayISO(), to: todayISO() });
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo exportar.'));
    } finally {
      setExporting(false);
    }
  };

  const columns: TableColumn<Loan>[] = [
    {
      key: 'associate',
      header: 'Asociado',
      mobileLabel: 'Documento',
      render: (l) => (
        <div className="min-w-0 text-right md:text-left">
          <p className="hidden whitespace-nowrap font-semibold text-slate-900 md:block">{l.thirdPartyName}</p>
          <p className="text-xs text-slate-500">{l.thirdPartyIdNumber}</p>
        </div>
      ),
    },
    { key: 'loan', header: 'Préstamo', render: (l) => <span className="font-mono text-xs">{l.loanNumber}</span> },
    { key: 'principal', header: 'Valor inicial', align: 'right', render: (l) => formatCOP(l.principalAmount) },
    { key: 'paidPrincipal', header: 'Capital pagado', align: 'right', render: (l) => formatCOP(l.paidPrincipal) },
    { key: 'paidInterest', header: 'Interés pagado', align: 'right', render: (l) => formatCOP(l.paidInterest) },
    { key: 'balance', header: 'Saldo pendiente', align: 'right', render: (l) => <strong className="text-slate-900">{formatCOP(l.outstandingPrincipal)}</strong> },
    {
      key: 'inst',
      header: 'Cuotas pag. / pend.',
      align: 'right',
      render: (l) => (
        <span>
          {l.paidInstallments} / {l.termMonths}
          <span className="block text-xs text-slate-500">{l.pendingInstallments} pendiente(s)</span>
        </span>
      ),
    },
    {
      key: 'next',
      header: 'Próximo vencimiento',
      render: (l) =>
        l.nextDueDate ? (
          <span className="whitespace-nowrap">
            {formatDate(l.nextDueDate)}
            <span className="block text-xs text-slate-500">{formatCOP(l.nextDueAmount)}</span>
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (l) => (
        <span className="flex flex-col items-end gap-0.5 md:items-start">
          <StatusBadge status={l.portfolioStatus} />
          {l.overdueInstallments > 0 && <span className="text-[11px] text-red-700">{l.overdueInstallments} vencida(s) · {formatCOP(l.overdueAmount)}</span>}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      hideOnMobile: true,
      render: (l) => (
        <button type="button" className={buttonClass.ghost} onClick={() => setScheduleId(l.id)}>
          <Eye size={14} /> Detalle
        </button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Cuentas por cobrar"
        subtitle="Obligaciones vigentes de los asociados con la asociación. Solo el capital pagado reduce el saldo."
        icon={<Scale size={20} />}
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
        <StatCard label="Total por cobrar" value={formatCOP(total, '$0')} tone="primary" hint={`${loans.length} préstamo(s) activo(s)`} />
        <StatCard label="Cartera al día" value={formatCOP(total - overdueBalance, '$0')} tone="positive" />
        <StatCard label="Cartera en mora" value={formatCOP(overdueBalance, '$0')} tone={overdueBalance > 0 ? 'negative' : 'neutral'} hint={`${overdueLoans.length} préstamo(s)`} />
        <StatCard label="Valor vencido" value={formatCOP(overdueAmount, '$0')} tone={overdueAmount > 0 ? 'negative' : 'neutral'} />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por asociado, documento o préstamo…"
        activeFilters={portfolio ? 1 : 0}
        onClear={() => setPortfolio('')}
      >
        <FormField label="Estado">
          <select className={selectClass} value={portfolio} onChange={(e) => setPortfolio(e.target.value)}>
            <option value="">Todos</option>
            <option value="AL_DIA">Al día</option>
            <option value="EN_MORA">En mora</option>
          </select>
        </FormField>
      </SearchFilterBar>

      <ResponsiveTable
        columns={columns}
        rows={rows}
        rowKey={(l) => l.id}
        loading={loading}
        minWidth={1080}
        cardTitle={(l) => (
          <span className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">{l.thirdPartyName}</span>
            <StatusBadge status={l.portfolioStatus} />
          </span>
        )}
        cardActions={(l) => (
          <>
            <button type="button" className={buttonClass.ghost} onClick={() => setScheduleId(l.id)}>
              <Eye size={14} /> Plan de pagos
            </button>
          </>
        )}
        footer={
          <tr>
            <td className="px-4 py-3 text-xs font-bold uppercase" colSpan={5}>
              Total saldo pendiente
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCOP(rows.reduce((s, l) => s + l.outstandingPrincipal, 0))}</td>
            <td colSpan={4} />
          </tr>
        }
        emptyMessage="No hay obligaciones activas."
      />

      <LoanScheduleModal
        loanId={scheduleId}
        onClose={() => setScheduleId(null)}
        onRegisterPayment={(loan) => {
          setScheduleId(null);
          setPaymentLoan(loan);
        }}
      />
      <NewLoanPaymentModal open={!!paymentLoan} initialLoan={paymentLoan} onClose={() => setPaymentLoan(null)} onRegistered={() => void load()} />
    </PageContainer>
  );
};
