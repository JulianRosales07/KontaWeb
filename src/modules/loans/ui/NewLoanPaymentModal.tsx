import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Printer, HandCoins } from 'lucide-react';
import {
  loanApi,
  PAYMENT_METHODS,
  previewAllocation,
  type Loan,
  type LoanPaymentReceipt,
  type PaymentMethod,
  type ScheduleLine,
} from '../api/loanApi';
import type { AssociateSummary } from '../../associates/infrastructure/directoryApi';
import { AssociatePicker } from '../../associates/ui/components/AssociatePicker';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, todayISO } from '../../../shared/lib/format';
import { Modal } from '../../../shared/ui/components/Modal';
import { Alert, buttonClass } from '../../../shared/ui/components/PageHeader';
import { FormField, MoneyInput, inputClass, selectClass } from '../../../shared/ui/components/MoneyInput';
import { StatusBadge } from '../../../shared/ui/components/StatusBadge';
import { usePrintDocument } from '../../../shared/ui/components/PrintDocumentLayout';
import { LoanPaymentReceiptDocument } from './LoanPaymentReceiptDocument';

const CASH_ACCOUNTS = [
  { code: '110505', label: '110505 - Caja general' },
  { code: '111005', label: '111005 - Bancos (moneda nacional)' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered: (receipt: LoanPaymentReceipt) => void;
  /** Abre el formulario con un préstamo ya elegido (desde el plan de pagos). */
  initialLoan?: Loan | null;
}

/**
 * Nuevo abono: asociado → préstamos activos con sus cuotas → cuotas a pagar (en orden) → datos del pago.
 * Cada abono queda ligado a asociado, préstamo, cuota, fecha, valor, medio de pago y comprobante.
 */
export const NewLoanPaymentModal: React.FC<Props> = ({ open, onClose, onRegistered, initialLoan = null }) => {
  const [associate, setAssociate] = useState<AssociateSummary | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loanId, setLoanId] = useState<string | null>(null);
  /** installmentId → valor a abonar (null = vacío). */
  const [selected, setSelected] = useState<Record<string, number | null>>({});
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashAccount, setCashAccount] = useState('110505');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState<LoanPaymentReceipt | null>(null);
  const { documentId, print } = usePrintDocument();

  // Reinicio al abrir
  useEffect(() => {
    if (!open) return;
    setReceipt(null);
    setError(null);
    setSelected({});
    setPaymentDate(todayISO());
    setMethod('CASH');
    setCashAccount('110505');
    setReference('');
    setNotes('');
    if (initialLoan) {
      setAssociate({
        id: initialLoan.thirdPartyId,
        fullName: initialLoan.thirdPartyName,
        identificationNumber: initialLoan.thirdPartyIdNumber,
      } as AssociateSummary);
      setLoanId(initialLoan.id);
    } else {
      setAssociate(null);
      setLoanId(null);
    }
  }, [open, initialLoan]);

  // Préstamos activos del asociado con su plan de cuotas
  useEffect(() => {
    if (!associate) {
      setLoans([]);
      return;
    }
    setLoadingLoans(true);
    loanApi
      .list({ thirdPartyId: associate.id, status: 'ACTIVE', includeInstallments: true })
      .then((ls) => {
        setLoans(ls);
        setLoanId((current) => current ?? (ls.length === 1 ? ls[0].id : null));
      })
      .catch((e) => setError(apiErrorMessage(e, 'No se pudieron cargar los préstamos del asociado.')))
      .finally(() => setLoadingLoans(false));
  }, [associate]);

  const loan = loans.find((l) => l.id === loanId) ?? null;
  const pendingLines = useMemo(() => (loan?.installments ?? []).filter((l) => l.status !== 'PAID'), [loan]);

  /** Selecciona hasta la cuota indicada (las cuotas se pagan en orden). */
  const toggleLine = (line: ScheduleLine) => {
    const idx = pendingLines.findIndex((l) => l.id === line.id);
    const isSelected = line.id! in selected;
    const next: Record<string, number | null> = {};
    const until = isSelected ? idx - 1 : idx;
    pendingLines.forEach((l, i) => {
      if (i <= until) next[l.id!] = selected[l.id!] ?? l.pending;
    });
    // Solo la última cuota seleccionada puede quedar con abono parcial
    pendingLines.forEach((l, i) => {
      if (i < until && next[l.id!] !== undefined) next[l.id!] = l.pending;
    });
    setSelected(next);
  };

  const lastSelectedId = useMemo(() => {
    const ids = pendingLines.filter((l) => l.id! in selected).map((l) => l.id!);
    return ids[ids.length - 1];
  }, [pendingLines, selected]);

  const summary = useMemo(() => {
    let principal = 0;
    let interest = 0;
    let invalid: string | null = null;
    for (const l of pendingLines) {
      if (!(l.id! in selected)) continue;
      const amount = selected[l.id!];
      if (amount == null || amount <= 0) {
        invalid = `Ingrese el valor a abonar en la cuota ${l.number}`;
        continue;
      }
      if (amount > l.pending) invalid = `El valor de la cuota ${l.number} supera su saldo pendiente (${formatCOP(l.pending)})`;
      const a = previewAllocation(Math.min(amount, l.pending), l);
      principal += a.principal;
      interest += a.interest;
    }
    return { principal, interest, total: principal + interest, invalid };
  }, [pendingLines, selected]);

  const selectedCount = Object.keys(selected).length;

  const submit = async () => {
    setError(null);
    if (!loan) return setError('Seleccione el préstamo.');
    if (selectedCount === 0) return setError('Seleccione al menos una cuota.');
    if (summary.invalid) return setError(summary.invalid);
    if (!paymentDate) return setError('Ingrese la fecha del abono.');
    setSaving(true);
    try {
      const r = await loanApi.registerPayment(loan.id, {
        paymentDate,
        paymentMethod: method,
        cashAccountCode: cashAccount,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        allocations: pendingLines.filter((l) => l.id! in selected).map((l) => ({ installmentId: l.id!, amount: selected[l.id!]! })),
      });
      setReceipt(r);
      onRegistered(r);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo registrar el abono.'));
    } finally {
      setSaving(false);
    }
  };

  if (receipt) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title="Abono registrado"
        subtitle={`Recibo ${receipt.receiptNumber} · Comprobante ${receipt.voucherNumber ?? ''}`}
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className={buttonClass.primary} onClick={print}>
              <Printer size={16} /> Imprimir recibo
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Alert tone="success">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={16} /> Capital {formatCOP(receipt.principalApplied)} · Interés {formatCOP(receipt.interestApplied)} · Nuevo saldo del préstamo{' '}
              <strong>{formatCOP(receipt.loanOutstandingAfter)}</strong>
            </span>
          </Alert>
          <LoanPaymentReceiptDocument receipt={receipt} documentId={documentId} showPreview />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={saving}
      size="xl"
      className="sm:min-h-[620px]"
      title="Nuevo abono a préstamo"
      subtitle="El abono se aplica primero al interés y luego al capital de cada cuota; solo el capital reduce el saldo."
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={buttonClass.primary} onClick={submit} disabled={saving || selectedCount === 0}>
            {saving ? 'Registrando…' : `Registrar abono ${summary.total > 0 ? formatCOP(summary.total) : ''}`}
          </button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-6">
        {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

        {/* 1. Asociado */}
        <section className="flex flex-col gap-2">
          <StepTitle n={1} title="Asociado" />
          <AssociatePicker
            value={associate}
            onChange={(a) => {
              setAssociate(a);
              setLoanId(null);
              setSelected({});
            }}
            showLoans
            disabled={!!initialLoan}
          />
        </section>

        {/* 2. Préstamos y cuotas */}
        {associate ? (
          <section className="flex flex-col gap-3 animate-in fade-in duration-200">
            <StepTitle n={2} title="Préstamo y cuotas" />
            {loadingLoans ? (
              <p className="text-sm text-slate-500">Cargando préstamos…</p>
            ) : loans.length === 0 ? (
              <Alert tone="info">El asociado no tiene préstamos activos con saldo pendiente.</Alert>
            ) : (
              <div className="flex flex-col gap-3">
                {loans.map((l) => (
                  <div
                    key={l.id}
                    className={`min-w-0 rounded-xl border p-3 sm:p-4 ${l.id === loanId ? 'border-indigo-400 ring-2 ring-indigo-500/20' : 'border-slate-200'}`}
                  >
                    <label className="flex cursor-pointer flex-wrap items-start justify-between gap-3">
                      <span className="flex min-w-0 items-start gap-2.5">
                        <input
                          type="radio"
                          name="loan"
                          className="mt-1 h-4 w-4 accent-indigo-600"
                          checked={l.id === loanId}
                          onChange={() => {
                            setLoanId(l.id);
                            setSelected({});
                          }}
                        />
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900">Préstamo {l.loanNumber}</span>
                          <span className="block text-xs text-slate-500">
                            Valor inicial {formatCOP(l.principalAmount)} · {l.paidInstallments}/{l.termMonths} cuotas pagadas
                          </span>
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-xs text-slate-500">Saldo actual</span>
                        <span className="block font-bold tabular-nums text-slate-900">{formatCOP(l.outstandingPrincipal)}</span>
                        <StatusBadge status={l.portfolioStatus} />
                      </span>
                    </label>

                    {l.id === loanId && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <InstallmentPicker
                          lines={l.installments ?? []}
                          selected={selected}
                          lastSelectedId={lastSelectedId}
                          onToggle={toggleLine}
                          onAmount={(id, v) => setSelected((prev) => ({ ...prev, [id]: v }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-8 text-center sm:min-h-[220px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <HandCoins size={24} />
            </div>
            <div className="max-w-md">
              <p className="text-sm font-bold text-slate-800">Paso 2: Préstamos y cuotas a abonar</p>
              <p className="text-xs text-slate-500 mt-1">
                Busca y selecciona al asociado en el buscador superior para cargar sus créditos vigentes y el plan de cuotas pendiente.
              </p>
            </div>
          </div>
        )}

        {/* 3. Datos del pago */}
        {loan && selectedCount > 0 && (
          <section className="flex flex-col gap-3">
            <StepTitle n={3} title="Datos del pago" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Fecha del abono" required htmlFor="pay-date">
                <input id="pay-date" type="date" className={inputClass} value={paymentDate} max={todayISO()} onChange={(e) => setPaymentDate(e.target.value)} />
              </FormField>
              <FormField label="Medio de pago" required htmlFor="pay-method">
                <select
                  id="pay-method"
                  className={selectClass}
                  value={method}
                  onChange={(e) => {
                    const m = e.target.value as PaymentMethod;
                    setMethod(m);
                    setCashAccount(PAYMENT_METHODS.find((p) => p.value === m)?.defaultAccount ?? '110505');
                  }}
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Cuenta que recibe" required htmlFor="pay-account">
                <select id="pay-account" className={selectClass} value={cashAccount} onChange={(e) => setCashAccount(e.target.value)}>
                  {CASH_ACCOUNTS.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="N.º comprobante" htmlFor="pay-ref" hint="Consignación, transferencia o recibo físico">
                <input id="pay-ref" className={inputClass} value={reference} maxLength={100} onChange={(e) => setReference(e.target.value)} placeholder="Opcional" />
              </FormField>
              <FormField label="Observaciones" htmlFor="pay-notes" className="sm:col-span-2 lg:col-span-4">
                <input id="pay-notes" className={inputClass} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-4">
              <SummaryItem label="Capital" value={formatCOP(summary.principal)} />
              <SummaryItem label="Interés" value={formatCOP(summary.interest)} />
              <SummaryItem label="Total a recibir" value={formatCOP(summary.total)} strong />
              <SummaryItem label="Saldo después" value={formatCOP(loan.outstandingPrincipal - summary.principal)} />
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
};

const StepTitle: React.FC<{ n: number; title: string }> = ({ n, title }) => (
  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">{n}</span>
    {title}
  </h4>
);

const SummaryItem: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="min-w-0">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`truncate tabular-nums ${strong ? 'text-base font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}>{value}</p>
  </div>
);

/** Lista de cuotas: pagadas (informativas) y pendientes seleccionables en orden. */
export const InstallmentPicker: React.FC<{
  lines: ScheduleLine[];
  selected: Record<string, number | null>;
  lastSelectedId?: string;
  onToggle: (l: ScheduleLine) => void;
  onAmount: (id: string, value: number | null) => void;
}> = ({ lines, selected, lastSelectedId, onToggle, onAmount }) => (
  <ul className="flex flex-col gap-2">
    {lines.map((l) => {
      const paid = l.status === 'PAID';
      const isSel = !paid && l.id! in selected;
      return (
        <li
          key={l.number}
          className={`min-w-0 rounded-lg border px-3 py-2.5 ${paid ? 'border-slate-100 bg-slate-50 opacity-70' : isSel ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <label className={`flex min-w-0 items-start gap-2.5 ${paid ? '' : 'cursor-pointer'}`}>
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-indigo-600" disabled={paid} checked={paid || isSel} onChange={() => onToggle(l)} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  Cuota {l.number} <span className="font-normal text-slate-500">· vence {formatDate(l.dueDate)}</span>
                </span>
                <span className="mt-0.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-600 sm:grid-cols-4">
                  <span>Capital {formatCOP(l.principal)}</span>
                  <span>Interés {formatCOP(l.interest)}</span>
                  <span>Total {formatCOP(l.total)}</span>
                  <span>Saldo {formatCOP(l.closingBalance)}</span>
                </span>
              </span>
            </label>
            <span className="flex flex-col items-end gap-1">
              {l.overdue && !paid ? <StatusBadge label={`Vencida · ${l.daysOverdue} d`} tone="danger" /> : <StatusBadge status={l.status} />}
              {!paid && l.status === 'PARTIAL' && <span className="text-xs text-slate-600">Pendiente {formatCOP(l.pending)}</span>}
            </span>
          </div>
          {isSel && (
            <div className="mt-2 grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,220px)_1fr]">
              <FormField label="Valor a abonar" htmlFor={`amt-${l.id}`}>
                <MoneyInput
                  id={`amt-${l.id}`}
                  value={selected[l.id!]}
                  onChange={(v) => onAmount(l.id!, v)}
                  disabled={l.id !== lastSelectedId}
                  invalid={(selected[l.id!] ?? 0) > l.pending}
                />
              </FormField>
              <p className="text-xs text-slate-500">
                {l.id === lastSelectedId ? `Máximo ${formatCOP(l.pending)}. Puede abonar un valor parcial.` : 'Las cuotas anteriores se pagan completas.'}
              </p>
            </div>
          )}
        </li>
      );
    })}
  </ul>
);
