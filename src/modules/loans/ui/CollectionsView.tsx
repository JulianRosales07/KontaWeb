import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HandCoins, Printer, ReceiptText, Wallet } from 'lucide-react';
import { loanApi, paymentMethodLabel, type LoanPaymentReceipt } from '../api/loanApi';
import { associateApi } from '../../associates/infrastructure/associateApi';
import type { AssociateReceipt } from '../../associates/types/associate';
import { QuotaReceiptDocument, QuotaReceiptModal } from '../../associates/ui/components/QuotaReceiptModal';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, normalizeText, todayISO } from '../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../shared/ui/components/ResponsiveTable';
import { FormField, inputClass } from '../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../shared/ui/components/Modal';
import { usePrintDocument } from '../../../shared/ui/components/PrintDocumentLayout';
import { NewLoanPaymentModal } from './NewLoanPaymentModal';
import { LoanPaymentReceiptDocument } from './LoanPaymentReceiptDocument';

type Tab = 'abonos' | 'cuotas';

export const CollectionsView: React.FC = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('COLLECTIONS_CREATE');
  const [tab, setTab] = useState<Tab>('abonos');
  const [from, setFrom] = useState(`${todayISO().slice(0, 8)}01`);
  const [to, setTo] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [payments, setPayments] = useState<LoanPaymentReceipt[]>([]);
  const [receipts, setReceipts] = useState<AssociateReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState<LoanPaymentReceipt | null>(null);
  const [viewReceipt, setViewReceipt] = useState<AssociateReceipt | null>(null);
  const paymentPrint = usePrintDocument();
  const receiptPrint = usePrintDocument();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, r] = await Promise.all([loanApi.paymentsBetween(from, to), associateApi.getReceipts(0, 500)]);
      setPayments(p);
      setReceipts(r.filter((x) => x.paymentDate >= from && x.paymentDate <= to));
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron cargar los recaudos.'));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = normalizeText(search);
  const filteredPayments = useMemo(
    () => payments.filter((p) => !q || normalizeText(`${p.thirdPartyName} ${p.thirdPartyIdNumber} ${p.loanNumber} ${p.receiptNumber} ${p.reference ?? ''}`).includes(q)),
    [payments, q]
  );
  const filteredReceipts = useMemo(
    () => receipts.filter((r) => !q || normalizeText(`${r.thirdPartyName} ${r.thirdPartyIdNumber} ${r.receiptNumber}`).includes(q)),
    [receipts, q]
  );

  const totals = {
    principal: filteredPayments.reduce((s, p) => s + p.principalApplied, 0),
    interest: filteredPayments.reduce((s, p) => s + p.interestApplied, 0),
    quotas: filteredReceipts.reduce((s, r) => s + Number(r.totalAmount), 0),
  };

  const paymentColumns: TableColumn<LoanPaymentReceipt>[] = [
    { key: 'date', header: 'Fecha', render: (p) => formatDate(p.paymentDate) },
    { key: 'receipt', header: 'Recibo', render: (p) => <span className="font-mono text-xs">{p.receiptNumber}</span>, hideOnMobile: true },
    {
      key: 'associate',
      header: 'Asociado',
      render: (p) => (
        <div className="min-w-0 text-right md:text-left">
          <p className="truncate font-semibold text-slate-900">{p.thirdPartyName}</p>
          <p className="text-xs text-slate-500">{p.thirdPartyIdNumber}</p>
        </div>
      ),
    },
    { key: 'loan', header: 'Préstamo · cuotas', render: (p) => `${p.loanNumber} · ${p.lines.map((l) => l.installmentNumber).join(', ')}` },
    { key: 'method', header: 'Medio de pago', render: (p) => paymentMethodLabel(p.paymentMethod) },
    { key: 'principal', header: 'Capital', align: 'right', render: (p) => formatCOP(p.principalApplied) },
    { key: 'interest', header: 'Interés', align: 'right', render: (p) => formatCOP(p.interestApplied) },
    { key: 'total', header: 'Total', align: 'right', render: (p) => <strong>{formatCOP(p.totalAmount)}</strong> },
    { key: 'voucher', header: 'Comprobante', render: (p) => <span className="font-mono text-xs">{p.voucherNumber ?? '—'}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      hideOnMobile: true,
      render: (p) => (
        <button type="button" className={buttonClass.ghost} onClick={() => setViewPayment(p)}>
          <ReceiptText size={14} /> Recibo
        </button>
      ),
    },
  ];

  const receiptColumns: TableColumn<AssociateReceipt>[] = [
    { key: 'date', header: 'Fecha', render: (r) => formatDate(r.paymentDate) },
    { key: 'receipt', header: 'Recibo', render: (r) => <span className="font-mono text-xs">{r.receiptNumber}</span>, hideOnMobile: true },
    {
      key: 'associate',
      header: 'Asociado',
      render: (r) => (
        <div className="min-w-0 text-right md:text-left">
          <p className="truncate font-semibold text-slate-900">{r.thirdPartyName}</p>
          <p className="text-xs text-slate-500">{r.thirdPartyIdNumber}</p>
        </div>
      ),
    },
    { key: 'concepts', header: 'Conceptos', render: (r) => `${r.items.length} concepto(s)` },
    { key: 'account', header: 'Recibido en', render: (r) => r.cashAccountCode },
    { key: 'total', header: 'Total', align: 'right', render: (r) => <strong>{formatCOP(r.totalAmount)}</strong> },
    { key: 'voucher', header: 'Comprobante', render: (r) => <span className="font-mono text-xs">{r.voucherNumber ?? '—'}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      hideOnMobile: true,
      render: (r) => (
        <button type="button" className={buttonClass.ghost} onClick={() => setViewReceipt(r)}>
          <ReceiptText size={14} /> Recibo
        </button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Recaudos y abonos"
        subtitle="Cada abono queda ligado al asociado, préstamo, cuota, fecha, valor, medio de pago y comprobante."
        icon={<Wallet size={20} />}
        actions={
          canCreate && (
            <button type="button" className={buttonClass.primary} onClick={() => setQuotaOpen(true)}>
              <ReceiptText size={16} /> Recaudo de cuota
            </button>
          )
        }
      />

      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Total recaudado" value={formatCOP(totals.principal + totals.interest + totals.quotas, '$0')} tone="primary" />
        <StatCard label="Capital de préstamos" value={formatCOP(totals.principal, '$0')} tone="positive" />
        <StatCard label="Intereses" value={formatCOP(totals.interest, '$0')} tone="positive" />
        <StatCard label="Cuotas y aportes" value={formatCOP(totals.quotas, '$0')} />
      </div>

      <SearchFilterBar search={search} onSearchChange={setSearch} placeholder="Buscar por asociado, documento, préstamo o recibo…" activeFilters={0}>
        <FormField label="Desde">
          <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="Hasta">
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
      </SearchFilterBar>

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1" role="tablist">
        {(
          [
            ['abonos', `Abonos a préstamos (${filteredPayments.length})`],
            ['cuotas', `Cuotas y aportes (${filteredReceipts.length})`],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`h-9 shrink-0 rounded-lg px-4 text-sm font-semibold cursor-pointer ${tab === id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'abonos' ? (
        <ResponsiveTable
          columns={paymentColumns}
          rows={filteredPayments}
          rowKey={(p) => p.receiptNumber}
          loading={loading}
          minWidth={1100}
          cardTitle={(p) => (
            <span className="flex justify-between gap-2">
              <span className="font-mono text-xs">{p.receiptNumber}</span>
              <span className="tabular-nums">{formatCOP(p.totalAmount)}</span>
            </span>
          )}
          cardActions={(p) => (
            <button type="button" className={buttonClass.ghost} onClick={() => setViewPayment(p)}>
              <ReceiptText size={14} /> Ver recibo
            </button>
          )}
          emptyMessage="No hay abonos a préstamos en el periodo."
        />
      ) : (
        <ResponsiveTable
          columns={receiptColumns}
          rows={filteredReceipts}
          rowKey={(r) => r.id}
          loading={loading}
          cardTitle={(r) => (
            <span className="flex justify-between gap-2">
              <span className="font-mono text-xs">{r.receiptNumber}</span>
              <span className="tabular-nums">{formatCOP(r.totalAmount)}</span>
            </span>
          )}
          cardActions={(r) => (
            <button type="button" className={buttonClass.ghost} onClick={() => setViewReceipt(r)}>
              <ReceiptText size={14} /> Ver recibo
            </button>
          )}
          emptyMessage="No hay recaudos de cuotas en el periodo."
        />
      )}

      <NewLoanPaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onRegistered={() => void load()} />
      <QuotaReceiptModal open={quotaOpen} onClose={() => setQuotaOpen(false)} onRegistered={() => void load()} />

      <Modal
        open={!!viewPayment}
        onClose={() => setViewPayment(null)}
        size="lg"
        title={`Recibo ${viewPayment?.receiptNumber ?? ''}`}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setViewPayment(null)}>
              Cerrar
            </button>
            <button type="button" className={buttonClass.primary} onClick={paymentPrint.print}>
              <Printer size={16} /> Imprimir
            </button>
          </>
        }
      >
        {viewPayment && <LoanPaymentReceiptDocument receipt={viewPayment} documentId={paymentPrint.documentId} showPreview />}
      </Modal>
      <Modal
        open={!!viewReceipt}
        onClose={() => setViewReceipt(null)}
        size="lg"
        title={`Recibo ${viewReceipt?.receiptNumber ?? ''}`}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setViewReceipt(null)}>
              Cerrar
            </button>
            <button type="button" className={buttonClass.primary} onClick={receiptPrint.print}>
              <Printer size={16} /> Imprimir
            </button>
          </>
        }
      >
        {viewReceipt && <QuotaReceiptDocument receipt={viewReceipt} documentId={receiptPrint.documentId} showPreview />}
      </Modal>
    </PageContainer>
  );
};
