import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Eye, HandCoins, Landmark, Plus, Upload } from 'lucide-react';
import { loanApi, type Loan } from '../api/loanApi';
import { legacyImportDone, markLegacyImportDone, readLegacyLoans, toImportPayload, type LegacyLoan } from '../legacyImport';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, formatPercent, normalizeText } from '../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../shared/ui/components/ResponsiveTable';
import { StatusBadge } from '../../../shared/ui/components/StatusBadge';
import { FormField, selectClass } from '../../../shared/ui/components/MoneyInput';
import { ConfirmationModal } from '../../../shared/ui/components/Modal';
import { CreateLoanModal } from './CreateLoanModal';
import { LoanScheduleModal } from './LoanScheduleModal';
import { NewLoanPaymentModal } from './NewLoanPaymentModal';

export const LoansView: React.FC = () => {
  const { hasPermission } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | Loan['status']>('ACTIVE');
  const [portfolio, setPortfolio] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);
  const [legacy, setLegacy] = useState<LegacyLoan[]>(() => (legacyImportDone() ? [] : readLegacyLoans()));
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLoans(await loanApi.list());
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron cargar los préstamos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return loans.filter(
      (l) =>
        (!status || l.status === status) &&
        (!portfolio || l.portfolioStatus === portfolio) &&
        (!q || normalizeText(`${l.loanNumber} ${l.thirdPartyName} ${l.thirdPartyIdNumber}`).includes(q))
    );
  }, [loans, search, status, portfolio]);

  const active = loans.filter((l) => l.status === 'ACTIVE');
  const kpis = {
    portfolio: active.reduce((s, l) => s + l.outstandingPrincipal, 0),
    activeCount: active.length,
    overdue: active.filter((l) => l.portfolioStatus === 'EN_MORA').length,
    interest: loans.reduce((s, l) => s + l.paidInterest, 0),
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const res = await loanApi.importLegacy(toImportPayload(legacy));
      markLegacyImportDone();
      setLegacy([]);
      setImportOpen(false);
      setNotice(`Importación completada: ${res.imported} préstamo(s) importado(s), ${res.skipped} ya existían.`);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo importar.'));
      setImportOpen(false);
    } finally {
      setImporting(false);
    }
  };

  const rowActions = (l: Loan) => (
    <div className="flex flex-wrap justify-end gap-1">
      <button type="button" className={buttonClass.ghost} onClick={() => setScheduleId(l.id)}>
        <Eye size={14} /> Plan de pagos
      </button>
      {l.status === 'ACTIVE' && hasPermission('COLLECTIONS_CREATE') && (
        <button type="button" className={buttonClass.ghost} onClick={() => setPaymentLoan(l)}>
          <HandCoins size={14} /> Abonar
        </button>
      )}
    </div>
  );

  const columns: TableColumn<Loan>[] = [
    {
      key: 'loan',
      header: 'Préstamo',
      hideOnMobile: true,
      render: (l) => (
        <div>
          <p className="font-mono text-xs font-bold text-slate-900">{l.loanNumber}</p>
          {l.legacy && <span className="text-[10px] font-semibold text-amber-700">Histórico</span>}
        </div>
      ),
    },
    {
      key: 'associate',
      header: 'Asociado',
      render: (l) => (
        <div className="min-w-0 text-right md:text-left">
          <p className="truncate font-semibold text-slate-900">{l.thirdPartyName}</p>
          <p className="text-xs text-slate-500">{l.thirdPartyIdNumber}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Desembolso', render: (l) => formatDate(l.disbursementDate) },
    { key: 'principal', header: 'Valor inicial', align: 'right', render: (l) => formatCOP(l.principalAmount) },
    { key: 'rate', header: 'Tasa', align: 'right', render: (l) => formatPercent(l.monthlyRate) },
    { key: 'inst', header: 'Cuotas', align: 'right', render: (l) => `${l.paidInstallments} / ${l.termMonths}` },
    { key: 'balance', header: 'Saldo', align: 'right', render: (l) => <strong>{formatCOP(l.outstandingPrincipal)}</strong> },
    { key: 'next', header: 'Próx. vencimiento', render: (l) => (l.nextDueDate ? `${formatDate(l.nextDueDate)} · ${formatCOP(l.nextDueAmount)}` : '—') },
    { key: 'status', header: 'Estado', render: (l) => <StatusBadge status={l.portfolioStatus} /> },
    { key: 'actions', header: '', align: 'right', hideOnMobile: true, render: rowActions },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Préstamos y plan de pagos"
        subtitle="Interés mensual calculado sobre el saldo de capital pendiente."
        icon={<Landmark size={20} />}
        actions={
          <>
            {legacy.length > 0 && hasPermission('LOANS_CREATE') && (
              <button type="button" className={buttonClass.secondary} onClick={() => setImportOpen(true)}>
                <Upload size={16} /> Importar {legacy.length} préstamo(s) locales
              </button>
            )}
            {hasPermission('LOANS_CREATE') && (
              <button type="button" className={buttonClass.primary} onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Nuevo préstamo
              </button>
            )}
          </>
        }
      />

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Cartera vigente" value={formatCOP(kpis.portfolio, '$0')} tone="primary" />
        <StatCard label="Préstamos activos" value={kpis.activeCount} />
        <StatCard label="En mora" value={kpis.overdue} tone={kpis.overdue > 0 ? 'negative' : 'neutral'} icon={<CalendarClock size={16} />} />
        <StatCard label="Intereses recaudados" value={formatCOP(kpis.interest, '$0')} tone="positive" />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por asociado, documento o número de préstamo…"
        activeFilters={(status ? 1 : 0) + (portfolio ? 1 : 0)}
        onClear={() => {
          setStatus('');
          setPortfolio('');
        }}
      >
        <FormField label="Estado">
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as Loan['status'] | '')}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="PAID">Pagados</option>
            <option value="CANCELLED">Anulados</option>
          </select>
        </FormField>
        <FormField label="Cartera">
          <select className={selectClass} value={portfolio} onChange={(e) => setPortfolio(e.target.value)}>
            <option value="">Todas</option>
            <option value="AL_DIA">Al día</option>
            <option value="EN_MORA">En mora</option>
          </select>
        </FormField>
      </SearchFilterBar>

      <ResponsiveTable
        columns={columns}
        rows={filtered}
        rowKey={(l) => l.id}
        loading={loading}
        minWidth={1100}
        cardTitle={(l) => (
          <span className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs">{l.loanNumber}</span>
            <StatusBadge status={l.portfolioStatus} />
          </span>
        )}
        cardActions={rowActions}
        emptyMessage="No hay préstamos que coincidan con los filtros."
      />

      <CreateLoanModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(loan) => {
          setCreateOpen(false);
          setNotice(`Préstamo ${loan.loanNumber} creado y desembolsado (comprobante ${loan.disbursementVoucherNumber}).`);
          void load();
          setScheduleId(loan.id);
        }}
      />
      <LoanScheduleModal
        loanId={scheduleId}
        onClose={() => setScheduleId(null)}
        onRegisterPayment={(loan) => {
          setScheduleId(null);
          setPaymentLoan(loan);
        }}
      />
      <NewLoanPaymentModal
        open={!!paymentLoan}
        initialLoan={paymentLoan}
        onClose={() => setPaymentLoan(null)}
        onRegistered={() => void load()}
      />
      <ConfirmationModal
        open={importOpen}
        title="Importar préstamos guardados en este navegador"
        loading={importing}
        confirmLabel="Importar"
        onCancel={() => setImportOpen(false)}
        onConfirm={runImport}
        message={
          <div className="flex flex-col gap-2">
            <p>
              Se enviarán al servidor los siguientes préstamos. Su plan de pagos se conserva <strong>tal como fue registrado</strong> (no se recalcula) y
              quedan marcados como históricos. Los préstamos que ya existan se omiten.
            </p>
            <ul className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 text-xs">
              {legacy.map((l) => (
                <li key={l.id} className="flex justify-between gap-2 border-b border-slate-100 px-3 py-1.5 last:border-0">
                  <span className="min-w-0 truncate">
                    {l.loanNumber} · {l.thirdPartyName}
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCOP(l.principalAmount)}</span>
                </li>
              ))}
            </ul>
          </div>
        }
      />
    </PageContainer>
  );
};
