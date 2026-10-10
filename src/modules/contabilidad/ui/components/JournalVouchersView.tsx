import React, { useCallback, useEffect, useState } from 'react';
import { BookOpenCheck, ChevronLeft, ChevronRight, Eye, Printer, RotateCcw } from 'lucide-react';
import {
  mainThirdParty,
  voucherApi,
  voucherDifference,
  VOUCHER_TYPE_LABELS,
  type JournalVoucher,
  type VoucherType,
} from '../../api/voucherApi';
import { useAuth } from '../../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, formatDateTime } from '../../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, StatCard, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { SearchFilterBar } from '../../../../shared/ui/components/SearchFilterBar';
import { ResponsiveTable, type TableColumn } from '../../../../shared/ui/components/ResponsiveTable';
import { StatusBadge } from '../../../../shared/ui/components/StatusBadge';
import { FormField, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';
import { Modal } from '../../../../shared/ui/components/Modal';
import { PrintDocumentLayout, SignatureBlock, usePrintDocument } from '../../../../shared/ui/components/PrintDocumentLayout';

const PAGE_SIZE = 20;

const BalanceBadge: React.FC<{ v: JournalVoucher }> = ({ v }) =>
  voucherDifference(v) === 0 ? <StatusBadge status="BALANCED" /> : <StatusBadge status="UNBALANCED" />;

export const JournalVouchersView: React.FC = () => {
  const [vouchers, setVouchers] = useState<JournalVoucher[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState<JournalVoucher | null>(null);

  useEffect(() => {
    const h = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(h);
  }, [search]);

  useEffect(() => setPage(0), [debounced, type, status, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await voucherApi.list({ q: debounced, type, status, startDate: from, endDate: to, page, size: PAGE_SIZE });
      setVouchers(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron cargar los comprobantes.'));
    } finally {
      setLoading(false);
    }
  }, [debounced, type, status, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pageDebit = vouchers.reduce((s, v) => s + Number(v.totalDebit), 0);
  const pageCredit = vouchers.reduce((s, v) => s + Number(v.totalCredit), 0);
  const unbalanced = vouchers.filter((v) => voucherDifference(v) !== 0).length;

  const columns: TableColumn<JournalVoucher>[] = [
    { key: 'number', header: 'Comprobante', hideOnMobile: true, render: (v) => <span className="font-mono text-xs font-bold text-slate-900">{v.voucherNumber}</span> },
    { key: 'date', header: 'Fecha', render: (v) => formatDate(v.issueDate) },
    { key: 'type', header: 'Tipo', render: (v) => VOUCHER_TYPE_LABELS[v.voucherType] ?? v.voucherType },
    {
      key: 'concept',
      header: 'Concepto',
      render: (v) => <span className="line-clamp-2 min-w-[220px] text-left">{v.description}</span>,
      hideOnMobile: true,
    },
    { key: 'party', header: 'Tercero', render: (v) => mainThirdParty(v)?.thirdPartyName ?? 'Varios' },
    { key: 'debit', header: 'Débitos', align: 'right', render: (v) => formatCOP(v.totalDebit) },
    { key: 'credit', header: 'Créditos', align: 'right', render: (v) => formatCOP(v.totalCredit) },
    {
      key: 'status',
      header: 'Estado',
      render: (v) => (
        <span className="flex flex-wrap justify-end gap-1 md:justify-start">
          <StatusBadge status={v.status} />
          <BalanceBadge v={v} />
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      hideOnMobile: true,
      render: (v) => (
        <button type="button" className={buttonClass.ghost} onClick={() => setSelected(v)}>
          <Eye size={14} /> Ver
        </button>
      ),
    },
  ];

  const activeFilters = [type, status, from, to].filter(Boolean).length;

  return (
    <PageContainer>
      <PageHeader
        title="Asientos y comprobantes"
        subtitle="Libro diario: cada comprobante debe cumplir partida doble (total débitos = total créditos)."
        icon={<BookOpenCheck size={20} />}
      />
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Comprobantes" value={totalElements} hint="Según filtros" />
        <StatCard label="Débitos (página)" value={formatCOP(pageDebit, '$0')} />
        <StatCard label="Créditos (página)" value={formatCOP(pageCredit, '$0')} />
        <StatCard label="Descuadrados (página)" value={unbalanced} tone={unbalanced > 0 ? 'negative' : 'positive'} />
      </div>

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por número de comprobante o concepto…"
        activeFilters={activeFilters}
        onClear={() => {
          setType('');
          setStatus('');
          setFrom('');
          setTo('');
        }}
      >
        <FormField label="Tipo">
          <select className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos</option>
            {(Object.keys(VOUCHER_TYPE_LABELS) as VoucherType[]).map((t) => (
              <option key={t} value={t}>
                {VOUCHER_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Estado">
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="POSTED">Contabilizado</option>
            <option value="DRAFT">Borrador</option>
            <option value="VOIDED">Anulado</option>
          </select>
        </FormField>
        <FormField label="Desde">
          <input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </FormField>
        <FormField label="Hasta">
          <input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </FormField>
      </SearchFilterBar>

      <ResponsiveTable
        columns={columns}
        rows={vouchers}
        rowKey={(v) => v.id}
        loading={loading}
        minWidth={1050}
        onRowClick={setSelected}
        cardTitle={(v) => (
          <span className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs">{v.voucherNumber}</span>
            <span className="text-xs font-normal text-slate-500">{formatDate(v.issueDate)}</span>
          </span>
        )}
        emptyMessage="No hay comprobantes para los filtros seleccionados."
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button type="button" className={buttonClass.secondary} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} /> Anterior
            </button>
            <button type="button" className={buttonClass.secondary} disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <VoucherDetailModal
        voucher={selected}
        onClose={() => setSelected(null)}
        onReversed={() => {
          setSelected(null);
          void load();
        }}
      />
    </PageContainer>
  );
};

/** Comprobante contable con presentación de documento y control de cuadre. */
export const VoucherDetailModal: React.FC<{ voucher: JournalVoucher | null; onClose: () => void; onReversed: () => void }> = ({
  voucher,
  onClose,
  onReversed,
}) => {
  const { hasPermission } = useAuth();
  const { documentId, print } = usePrintDocument();
  const [reversing, setReversing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirm(false);
    setReason('');
    setError(null);
  }, [voucher]);

  if (!voucher) return null;
  const diff = voucherDifference(voucher);
  const party = mainThirdParty(voucher);

  const reverse = async () => {
    setReversing(true);
    setError(null);
    try {
      await voucherApi.reverse(voucher.id, reason.trim() || undefined);
      onReversed();
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo anular el comprobante.'));
    } finally {
      setReversing(false);
    }
  };

  const linesTable = (printable: boolean) => (
    <table className={printable ? undefined : 'w-full min-w-[720px] border-collapse text-sm'}>
      <thead className={printable ? undefined : 'bg-slate-800 text-white'}>
        <tr>
          {['Código cuenta', 'Nombre cuenta', 'Tercero', 'Detalle'].map((h) => (
            <th key={h} className={printable ? undefined : 'px-3 py-2 text-left text-[11px] font-bold uppercase'}>
              {h}
            </th>
          ))}
          <th className={printable ? 'num' : 'px-3 py-2 text-right text-[11px] font-bold uppercase'}>Débito</th>
          <th className={printable ? 'num' : 'px-3 py-2 text-right text-[11px] font-bold uppercase'}>Crédito</th>
        </tr>
      </thead>
      <tbody>
        {voucher.entries.map((e) => (
          <tr key={e.id} className={printable ? undefined : 'border-b border-slate-100'}>
            <td className={printable ? undefined : 'whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold'}>{e.accountCode}</td>
            <td className={printable ? undefined : 'px-3 py-2'}>{e.accountName}</td>
            <td className={printable ? undefined : 'px-3 py-2 text-xs'}>
              {e.thirdPartyName ?? '—'}
              {e.thirdPartyIdentification ? <span className={printable ? undefined : 'block text-slate-500'}> {e.thirdPartyIdentification}</span> : null}
            </td>
            <td className={printable ? undefined : 'px-3 py-2 text-xs text-slate-600'}>{e.description ?? ''}</td>
            <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2 text-right tabular-nums'}>{Number(e.debit) > 0 ? formatCOP(e.debit) : ''}</td>
            <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2 text-right tabular-nums'}>{Number(e.credit) > 0 ? formatCOP(e.credit) : ''}</td>
          </tr>
        ))}
        <tr className={printable ? 'row-total' : 'bg-slate-100 font-bold'}>
          <td colSpan={4} className={printable ? undefined : 'px-3 py-2.5 text-xs uppercase'}>
            Totales
          </td>
          <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2.5 text-right tabular-nums'}>{formatCOP(voucher.totalDebit)}</td>
          <td className={printable ? 'num' : 'whitespace-nowrap px-3 py-2.5 text-right tabular-nums'}>{formatCOP(voucher.totalCredit)}</td>
        </tr>
      </tbody>
    </table>
  );

  return (
    <Modal
      open={!!voucher}
      onClose={onClose}
      locked={reversing}
      size="xl"
      title={`${VOUCHER_TYPE_LABELS[voucher.voucherType]} ${voucher.voucherNumber}`}
      subtitle={`${formatDate(voucher.issueDate)} · ${voucher.status === 'POSTED' ? 'Contabilizado' : voucher.status === 'VOIDED' ? 'Anulado' : 'Borrador'}`}
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={reversing}>
            Cerrar
          </button>
          {voucher.status === 'POSTED' && hasPermission('ACCOUNTING_CLOSE') && !confirm && (
            <button type="button" className={buttonClass.secondary} onClick={() => setConfirm(true)}>
              <RotateCcw size={16} /> Anular
            </button>
          )}
          <button type="button" className={buttonClass.primary} onClick={print}>
            <Printer size={16} /> Imprimir comprobante
          </button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}
        {confirm && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-900">
              Se generará una nota contable de contrapartida que invierte cada débito y crédito; el comprobante original quedará anulado.
            </p>
            <FormField label="Motivo de la anulación">
              <input className={inputClass} value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} />
            </FormField>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={buttonClass.secondary} onClick={() => setConfirm(false)} disabled={reversing}>
                Cancelar
              </button>
              <button type="button" className={buttonClass.danger} onClick={reverse} disabled={reversing}>
                {reversing ? 'Anulando…' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Número" value={<span className="font-mono">{voucher.voucherNumber}</span>} />
          <Info label="Fecha" value={formatDate(voucher.issueDate)} />
          <Info label="Tipo" value={VOUCHER_TYPE_LABELS[voucher.voucherType]} />
          <Info label="Tercero" value={party?.thirdPartyName ?? 'Varios'} />
          <Info label="Documento" value={party?.thirdPartyIdentification ?? '—'} />
          <Info label="Elaborado por" value={voucher.createdBy || 'Sistema'} />
          <Info label="Concepto" value={voucher.description} className="sm:col-span-2 lg:col-span-3" />
        </dl>

        <div className="table-scroll rounded-lg border border-slate-200">{linesTable(false)}</div>

        <div
          className={`flex flex-col gap-1 rounded-xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${
            diff === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <span>
            Total débitos = <strong className="tabular-nums">{formatCOP(voucher.totalDebit)}</strong> · Total créditos ={' '}
            <strong className="tabular-nums">{formatCOP(voucher.totalCredit)}</strong>
          </span>
          <span className="font-bold">{diff === 0 ? '✔ Asiento cuadrado' : `✖ Descuadrado por ${formatCOP(Math.abs(diff))}`}</span>
        </div>

        <PrintDocumentLayout
          documentId={documentId}
          title={VOUCHER_TYPE_LABELS[voucher.voucherType]}
          documentNumber={voucher.voucherNumber}
          meta={[
            { label: 'Fecha', value: formatDate(voucher.issueDate) },
            { label: 'Tipo', value: VOUCHER_TYPE_LABELS[voucher.voucherType] },
            { label: 'Estado', value: voucher.status === 'POSTED' ? 'Contabilizado' : voucher.status === 'VOIDED' ? 'Anulado' : 'Borrador' },
            { label: 'Tercero', value: party?.thirdPartyName ?? 'Varios' },
            { label: 'Documento', value: party?.thirdPartyIdentification ?? '—' },
            { label: 'Registrado', value: formatDateTime(voucher.createdAt) },
          ]}
          footer={
            <>
              <p>
                <strong>Concepto:</strong> {voucher.description}
              </p>
              <p>
                <strong>Totales:</strong> Débitos {formatCOP(voucher.totalDebit)} · Créditos {formatCOP(voucher.totalCredit)} ·{' '}
                {diff === 0 ? 'Asiento cuadrado' : `Descuadrado por ${formatCOP(Math.abs(diff))}`}
              </p>
              <p>
                <strong>Elaborado por:</strong> {voucher.createdBy || 'Sistema'}
              </p>
              <p>
                <strong>Observaciones:</strong> ______________________________________________
              </p>
              <SignatureBlock labels={['Elaborado por', 'Revisado por', 'Aprobado por']} />
            </>
          }
        >
          <p className="print-doc-section-title">Detalle contable</p>
          {linesTable(true)}
        </PrintDocumentLayout>
      </div>
    </Modal>
  );
};

const Info: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
    <dd className="break-words font-medium text-slate-900">{value}</dd>
  </div>
);
