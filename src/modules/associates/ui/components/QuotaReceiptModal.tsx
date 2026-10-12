import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Printer, HandCoins, ReceiptText, Layers, Wallet, PiggyBank, PlusCircle, Sparkles, Gavel } from 'lucide-react';
import { fineApi, type Fine } from '../../../fines/api/fineApi';
import { associateApi, CATEGORY_LABELS } from '../../infrastructure/associateApi';
import type { AssociateReceipt, QuotaCategory, QuotaTemplate } from '../../types/associate';
import type { AssociateSummary } from '../../infrastructure/directoryApi';
import { AssociatePicker } from './AssociatePicker';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, todayISO } from '../../../../shared/lib/format';
import { Modal } from '../../../../shared/ui/components/Modal';
import { Alert, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { FormField, MoneyInput, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';
import { PrintDocumentLayout, SignatureBlock, usePrintDocument } from '../../../../shared/ui/components/PrintDocumentLayout';
import { StatusBadge } from '../../../../shared/ui/components/StatusBadge';
import {
  loanApi,
  previewAllocation,
  type Loan,
  type LoanPaymentReceipt,
  type ScheduleLine,
} from '../../../loans/api/loanApi';
import { LoanPaymentReceiptDocument } from '../../../loans/ui/LoanPaymentReceiptDocument';
import { InstallmentPicker } from '../../../loans/ui/NewLoanPaymentModal';

const ALLOWED: QuotaCategory[] = ['INCOME', 'EQUITY_SAVING', 'SAVINGS', 'SOCIAL_FUND'];

type RecaudoMode = 'QUOTAS' | 'LOAN' | 'COMBINED';

interface Concept {
  key: string;
  conceptName: string;
  category: QuotaCategory;
  accountCode: string;
  accountName?: string;
  amount: number | null;
  enabled: boolean;
  mandatory: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onRegistered: (receipt: AssociateReceipt | LoanPaymentReceipt) => void;
  initialAssociate?: AssociateSummary | null;
}

/**
 * Recaudo de cuota unificado:
 * Permite registrar cuotas ordinarias/aportes, abonos a préstamos o ambos en un solo recibo.
 */
export const QuotaReceiptModal: React.FC<Props> = ({ open, onClose, onRegistered, initialAssociate = null }) => {
  const [mode, setMode] = useState<RecaudoMode>('QUOTAS');
  const [templates, setTemplates] = useState<QuotaTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [associate, setAssociate] = useState<AssociateSummary | null>(initialAssociate);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [cashAccount, setCashAccount] = useState('110505');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados de préstamos
  // Multas pendientes del asociado (se pueden cobrar en el mismo recibo)
  const [pendingFines, setPendingFines] = useState<Fine[]>([]);
  const [selectedFineIds, setSelectedFineIds] = useState<string[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loanId, setLoanId] = useState<string | null>(null);
  const [selectedInstallments, setSelectedInstallments] = useState<Record<string, number | null>>({});

  // Recibo final generado
  const [receipt, setReceipt] = useState<AssociateReceipt | null>(null);
  const [loanReceipt, setLoanReceipt] = useState<LoanPaymentReceipt | null>(null);
  const [extraSavingsInput, setExtraSavingsInput] = useState<number | null>(null);

  const { documentId, print } = usePrintDocument();

  // Reiniciar al abrir
  useEffect(() => {
    if (!open) return;
    setMode('QUOTAS');
    setAssociate(initialAssociate);
    setPaymentDate(todayISO());
    setCashAccount('110505');
    setNotes('');
    setError(null);
    setReceipt(null);
    setLoanReceipt(null);
    setSelectedInstallments({});
    setLoanId(null);
    setExtraSavingsInput(null);

    associateApi.getTemplates().then((t) => {
      setTemplates(t);
      setTemplateId(t[0]?.id ?? '');
    });
  }, [open, initialAssociate]);

  // Cargar préstamos activos del asociado
  useEffect(() => {
    if (!associate) {
      setLoans([]);
      setLoanId(null);
      setSelectedInstallments({});
      return;
    }
    setLoadingLoans(true);
    loanApi
      .list({ thirdPartyId: associate.id, status: 'ACTIVE', includeInstallments: true })
      .then((ls) => {
        setLoans(ls);
        if (ls.length > 0) {
          setLoanId((curr) => curr ?? ls[0].id);
        } else {
          setLoanId(null);
          // Si el asociado no tiene préstamos y estaba en modo préstamo, volver a cuotas
          if (mode === 'LOAN' || mode === 'COMBINED') {
            setMode('QUOTAS');
          }
        }
      })
      .catch(() => setLoans([]))
      .finally(() => setLoadingLoans(false));
  }, [associate]);

  useEffect(() => {
    setPendingFines([]);
    setSelectedFineIds([]);
    if (!associate) return;
    fineApi
      .list({ status: 'PENDING', thirdPartyId: associate.id })
      .then((fs) => {
        setPendingFines(fs);
        setSelectedFineIds(fs.map((f) => f.id));
      })
      .catch(() => setPendingFines([]));
  }, [associate]);

  // Conceptos de la plantilla de cuotas
  useEffect(() => {
    const t = templates.find((x) => x.id === templateId);
    setConcepts(
      (t?.items ?? [])
        .filter((i) => ALLOWED.includes(i.category))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((i, idx) => ({
          key: `${i.id ?? idx}`,
          conceptName: i.conceptName,
          category: i.category,
          accountCode: i.accountCode,
          accountName: i.accountName,
          amount: i.amount ?? null,
          enabled: i.isMandatory !== false,
          mandatory: i.isMandatory !== false,
        }))
    );
  }, [templates, templateId]);

  // Cuotas de préstamo pendientes
  const activeLoan = loans.find((l) => l.id === loanId) ?? null;
  const pendingLines = useMemo(() => (activeLoan?.installments ?? []).filter((l) => l.status !== 'PAID'), [activeLoan]);

  const toggleLine = (line: ScheduleLine) => {
    const idx = pendingLines.findIndex((l) => l.id === line.id);
    const isSelected = line.id! in selectedInstallments;
    const next: Record<string, number | null> = {};
    const until = isSelected ? idx - 1 : idx;
    pendingLines.forEach((l, i) => {
      if (i <= until) next[l.id!] = selectedInstallments[l.id!] ?? l.pending;
    });
    pendingLines.forEach((l, i) => {
      if (i < until && next[l.id!] !== undefined) next[l.id!] = l.pending;
    });
    setSelectedInstallments(next);
  };

  const lastSelectedId = useMemo(() => {
    const ids = pendingLines.filter((l) => l.id! in selectedInstallments).map((l) => l.id!);
    return ids[ids.length - 1];
  }, [pendingLines, selectedInstallments]);

  // Resumen del abono al préstamo
  const loanSummary = useMemo(() => {
    let principal = 0;
    let interest = 0;
    let invalid: string | null = null;
    for (const l of pendingLines) {
      if (!(l.id! in selectedInstallments)) continue;
      const amount = selectedInstallments[l.id!];
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
  }, [pendingLines, selectedInstallments]);

  const selectedInstallmentsCount = Object.keys(selectedInstallments).length;

  // Identifica los conceptos que corresponden a ahorros del socio (Aportes Ordinarios, Aporte Extra y Turismo/Recreación)
  const isSavingConcept = (c: { accountCode?: string; conceptName?: string; category?: string }) => {
    const code = c.accountCode || '';
    const name = (c.conceptName || '').toLowerCase();
    return (
      code === '311505' ||
      code === '311510' ||
      code === '238035' ||
      name.includes('ordinario') ||
      name.includes('extra') ||
      name.includes('turismo') ||
      name.includes('recreaci') ||
      c.category === 'EQUITY_SAVING'
    );
  };

  // Totales
  const quotaTotal = useMemo(() => concepts.filter((c) => c.enabled).reduce((s, c) => s + (c.amount ?? 0), 0), [concepts]);
  const savingsTotal = useMemo(
    () => concepts.filter((c) => c.enabled && isSavingConcept(c)).reduce((s, c) => s + (c.amount ?? 0), 0),
    [concepts]
  );
  const otherFundsTotal = useMemo(
    () => concepts.filter((c) => c.enabled && !isSavingConcept(c)).reduce((s, c) => s + (c.amount ?? 0), 0),
    [concepts]
  );

  const updateConcept = (key: string, patch: Partial<Concept>) => setConcepts((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const handleApplyExtraSavings = () => {
    if (!extraSavingsInput || extraSavingsInput <= 0) return;
    const amountToAdd = extraSavingsInput;
    setConcepts((prev) => {
      let targetIndex = prev.findIndex((c) => c.accountCode === '311510' || c.conceptName.toLowerCase().includes('extra'));
      if (targetIndex === -1) {
        targetIndex = prev.findIndex((c) => isSavingConcept(c));
      }
      if (targetIndex === -1) {
        return [
          ...prev,
          {
            key: `custom-${Date.now()}`,
            conceptName: 'Ahorro Voluntario / Extra',
            category: 'EQUITY_SAVING',
            accountCode: '311510',
            accountName: 'Aportes extraordinarios',
            amount: amountToAdd,
            enabled: true,
            mandatory: false,
          },
        ];
      }
      return prev.map((c, idx) =>
        idx === targetIndex
          ? { ...c, enabled: true, amount: (c.amount ?? 0) + amountToAdd }
          : c
      );
    });
    setExtraSavingsInput(null);
  };

  const handleAddCustomConcept = () => {
    const newKey = `custom-${Date.now()}`;
    setConcepts((prev) => [
      ...prev,
      {
        key: newKey,
        conceptName: 'Ahorro Voluntario / Extra',
        category: 'EQUITY_SAVING',
        accountCode: '311510',
        accountName: 'Aportes extraordinarios',
        amount: null,
        enabled: true,
        mandatory: false,
      },
    ]);
  };

  const finesTotal = useMemo(
    () => pendingFines.filter((f) => selectedFineIds.includes(f.id)).reduce((s, f) => s + f.amount, 0),
    [pendingFines, selectedFineIds]
  );

  const grandTotal = useMemo(() => {
    if (mode === 'QUOTAS') return quotaTotal + finesTotal;
    if (mode === 'LOAN') return loanSummary.total;
    return quotaTotal + finesTotal + loanSummary.total;
  }, [mode, quotaTotal, finesTotal, loanSummary.total]);

  // Envío del formulario
  const submit = async () => {
    setError(null);
    if (!associate) return setError('Seleccione el asociado.');

    const isQuotaNeeded = mode === 'QUOTAS' || mode === 'COMBINED';
    const isLoanNeeded = mode === 'LOAN' || mode === 'COMBINED';

    const enabledConcepts = concepts.filter((c) => c.enabled);
    if (isQuotaNeeded) {
      if (enabledConcepts.length === 0 && selectedFineIds.length === 0) return setError('Seleccione al menos un concepto de cuota o una multa.');
      const empty = enabledConcepts.find((c) => c.amount == null || c.amount <= 0);
      if (empty) return setError(`Ingrese el valor de "${empty.conceptName}".`);
    }

    if (isLoanNeeded) {
      if (!activeLoan) return setError('Seleccione el préstamo al cual desea abonar.');
      if (selectedInstallmentsCount === 0) return setError('Seleccione al menos una cuota del préstamo a abonar.');
      if (loanSummary.invalid) return setError(loanSummary.invalid);
    }

    setSaving(true);
    try {
      if (mode === 'LOAN') {
        // Solo abono a préstamo
        const lr = await loanApi.registerPayment(activeLoan!.id, {
          paymentDate,
          paymentMethod: cashAccount.startsWith('1105') ? 'CASH' : 'TRANSFER',
          cashAccountCode: cashAccount,
          notes: notes.trim() || undefined,
          allocations: pendingLines
            .filter((l) => l.id! in selectedInstallments)
            .map((l) => ({ installmentId: l.id!, amount: selectedInstallments[l.id!]! })),
        });
        setLoanReceipt(lr);
        onRegistered(lr);
      } else {
        // Cuota ordinaria o Combinado (Cuota + Préstamo)
        const loanPortion =
          isLoanNeeded && activeLoan && selectedInstallmentsCount > 0
            ? {
                loanId: activeLoan.id,
                paymentMethod: cashAccount.startsWith('1105') ? 'CASH' : 'TRANSFER',
                allocations: pendingLines
                  .filter((l) => l.id! in selectedInstallments)
                  .map((l) => ({ installmentId: l.id!, amount: selectedInstallments[l.id!]! })),
              }
            : undefined;

        const r = await associateApi.registerReceipt({
          thirdPartyId: associate.id,
          templateId: templates.find((t) => t.id === templateId) && /^[0-9a-f-]{36}$/i.test(templateId) ? templateId : undefined,
          paymentDate,
          cashAccountCode: cashAccount,
          totalAmount: quotaTotal + finesTotal,
          notes: notes.trim() || undefined,
          fineIds: selectedFineIds.length > 0 ? selectedFineIds : undefined,
          items: enabledConcepts.map((c) => ({
            conceptName: c.conceptName,
            category: c.category,
            accountCode: c.accountCode,
            amount: c.amount!,
          })),
          loanPayment: loanPortion,
        });
        setReceipt(r);
        onRegistered(r);
      }
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo registrar el recaudo.'));
    } finally {
      setSaving(false);
    }
  };

  // Pantalla de éxito tras registrar
  if (loanReceipt) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title="Abono a préstamo registrado"
        subtitle={`Recibo ${loanReceipt.receiptNumber} · Comprobante ${loanReceipt.voucherNumber ?? ''}`}
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
        <Alert tone="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} /> Abono por {formatCOP(loanReceipt.totalAmount)} contabilizado. Capital:{' '}
            {formatCOP(loanReceipt.principalApplied)} · Interés: {formatCOP(loanReceipt.interestApplied)}
          </span>
        </Alert>
        <div className="mt-4">
          <LoanPaymentReceiptDocument receipt={loanReceipt} documentId={documentId} showPreview />
        </div>
      </Modal>
    );
  }

  if (receipt) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title={receipt.loanPayment ? 'Recaudo combinado registrado' : 'Recaudo registrado'}
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
        <Alert tone="success">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={16} />{' '}
            {receipt.loanPayment
              ? `Recaudo por ${formatCOP(receipt.totalAmount + (receipt.loanPayment.totalAmount ?? 0))} contabilizado (Cuotas: ${formatCOP(receipt.totalAmount)} + Préstamo: ${formatCOP(receipt.loanPayment.totalAmount ?? 0)}).`
              : `Recaudo por ${formatCOP(receipt.totalAmount)} contabilizado.`}
          </span>
        </Alert>
        <div className="mt-4">
          <QuotaReceiptDocument receipt={receipt} documentId={documentId} showPreview />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={saving}
      size={mode === 'COMBINED' || mode === 'LOAN' ? 'xl' : 'lg'}
      title="Recaudo de cuota"
      subtitle="Recaudo de cuotas ordinarias, aportes sociales y abonos a préstamos del asociado."
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className={buttonClass.primary}
            onClick={submit}
            disabled={saving || grandTotal <= 0}
          >
            {saving ? 'Registrando…' : `Registrar recaudo ${grandTotal > 0 ? formatCOP(grandTotal) : ''}`}
          </button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}

        {/* 1. Selección de Asociado */}
        <FormField label="Asociado" required>
          <AssociatePicker
            value={associate}
            onChange={(a) => {
              setAssociate(a);
              setLoanId(null);
              setSelectedInstallments({});
            }}
            showLoans
          />
        </FormField>

        {/* 2. Selector de tipo de recaudo */}
        {associate && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-700">¿Qué desea recaudar?</span>
              {loadingLoans ? (
                <span className="text-[11px] text-slate-400">Verificando créditos…</span>
              ) : loans.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                  <HandCoins size={12} /> {loans.length} {loans.length === 1 ? 'préstamo activo' : 'préstamos activos'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Sin préstamos activos</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setMode('QUOTAS')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'QUOTAS'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ReceiptText size={14} /> Cuotas y aportes
              </button>

              <button
                type="button"
                disabled={loans.length === 0}
                onClick={() => setMode('LOAN')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'LOAN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : loans.length > 0
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <HandCoins size={14} /> Abono a préstamo
              </button>

              <button
                type="button"
                disabled={loans.length === 0}
                onClick={() => setMode('COMBINED')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'COMBINED'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : loans.length > 0
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                }`}
              >
                <Layers size={14} /> Cuota + Préstamo
              </button>
            </div>
          </div>
        )}

        {/* 3. Datos generales del pago */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormField label="Fecha de pago" required>
            <input
              type="date"
              className={inputClass}
              value={paymentDate}
              max={todayISO()}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </FormField>
          <FormField label="Recibido en" required>
            <select className={selectClass} value={cashAccount} onChange={(e) => setCashAccount(e.target.value)}>
              <option value="110505">110505 - Caja general</option>
              <option value="111005">111005 - Bancos</option>
            </select>
          </FormField>
          <FormField label="Observaciones">
            <input
              className={inputClass}
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </FormField>
        </div>

        {/* 4. Sección Cuotas y aportes (si mode es QUOTAS o COMBINED) */}
        {(mode === 'QUOTAS' || mode === 'COMBINED') && (
          <fieldset className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <ReceiptText size={15} className="text-indigo-600" />
                Conceptos de Cuota Ordinaria y Aportes
              </legend>
              {templates.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Plantilla:</span>
                  <select
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Barra de Abono Rápido / Ahorro Extra */}
            <div className="rounded-lg bg-indigo-50/70 p-3 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PiggyBank size={18} className="text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">Abono Mayor / Ahorro Extraordinario</span>
                  <span className="text-[11px] text-indigo-700/80">
                    Digita el valor adicional para sumar directamente a los ahorros del socio:
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-36 sm:w-44">
                  <MoneyInput
                    value={extraSavingsInput}
                    onChange={setExtraSavingsInput}
                    placeholder="0"
                    aria-label="Valor adicional de ahorro"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyExtraSavings();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyExtraSavings}
                  disabled={!extraSavingsInput || extraSavingsInput <= 0}
                  className="px-3 py-2 text-xs font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Sumar valor digitado a los ahorros del socio"
                >
                  + Sumar al ahorro
                </button>
              </div>
            </div>

            {concepts.length === 0 && <p className="text-xs text-slate-500 py-2">La plantilla no tiene conceptos configurados.</p>}

            <div className="flex flex-col gap-2 pt-1">
              {concepts.map((c) => (
                <div
                  key={c.key}
                  className={`grid min-w-0 grid-cols-1 items-center gap-2 rounded-lg border px-3 py-2 sm:grid-cols-[minmax(0,1fr)_190px] ${
                    c.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}
                >
                  <label className="flex min-w-0 cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                      checked={c.enabled}
                      onChange={(e) => updateConcept(c.key, { enabled: e.target.checked })}
                    />
                    <span className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {c.conceptName}
                        </span>
                        {isSavingConcept(c) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <PiggyBank size={10} /> Ahorro del Socio
                          </span>
                        )}
                        {c.mandatory && <span className="text-[10px] font-bold uppercase text-slate-400">obligatorio</span>}
                      </div>
                      <span className="block truncate text-xs text-slate-500">
                        {CATEGORY_LABELS[c.category]} · {c.accountCode}
                        {c.accountName ? ` - ${c.accountName}` : ''}
                      </span>
                    </span>
                  </label>
                  <div>
                    <MoneyInput
                      value={c.amount}
                      onChange={(v) => updateConcept(c.key, { amount: v })}
                      disabled={!c.enabled}
                      aria-label={`Valor ${c.conceptName}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={handleAddCustomConcept}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <PlusCircle size={14} /> Agregar otro concepto / Ahorro voluntario
              </button>
            </div>

            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <PiggyBank size={13} className="text-purple-600" />
                  <strong>Ahorros del Socio</strong> (Aportes Ordinarios + Extra + Turismo):
                </span>
                <span className="font-semibold text-purple-700 tabular-nums">{formatCOP(savingsTotal, '$0')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Fondos Sociales y Sostenimiento (Solidaridad, etc.):</span>
                <span className="tabular-nums">{formatCOP(otherFundsTotal, '$0')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-sm font-bold text-slate-900">
                <span>Subtotal cuotas y aportes:</span>
                <strong className="text-base text-indigo-600 tabular-nums">{formatCOP(quotaTotal, '$0')}</strong>
              </div>
            </div>
          </fieldset>
        )}

        {/* Multas pendientes del asociado: se cobran en el mismo recibo (ingreso 429510) */}
        {(mode === 'QUOTAS' || mode === 'COMBINED') && pendingFines.length > 0 && (
          <fieldset className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Gavel size={14} /> Multas pendientes ({pendingFines.length})
              </legend>
              <button
                type="button"
                className="cursor-pointer text-xs font-semibold text-amber-800 hover:underline"
                onClick={() => setSelectedFineIds(selectedFineIds.length === pendingFines.length ? [] : pendingFines.map((f) => f.id))}
              >
                {selectedFineIds.length === pendingFines.length ? 'No cobrar ninguna' : 'Cobrar todas'}
              </button>
            </div>
            <ul className="flex flex-col gap-1.5">
              {pendingFines.map((f) => (
                <li key={f.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={selectedFineIds.includes(f.id)}
                      onChange={(e) =>
                        setSelectedFineIds((ids) => (e.target.checked ? [...ids, f.id] : ids.filter((x) => x !== f.id)))
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-800">{f.fineTypeName}</span>
                      <span className="block text-xs text-slate-500">
                        {formatDate(f.fineDate)}
                        {f.description ? ` · ${f.description}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">{formatCOP(f.amount)}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-amber-200 pt-2 text-sm font-bold text-amber-900">
              <span>Subtotal multas (ingreso 429510):</span>
              <span className="tabular-nums">{formatCOP(finesTotal, '$0')}</span>
            </div>
          </fieldset>
        )}

        {/* 5. Sección Abono a Préstamo (si mode es LOAN o COMBINED) */}
        {(mode === 'LOAN' || mode === 'COMBINED') && (
          <fieldset className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <legend className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                <HandCoins size={15} className="text-indigo-600" />
                Abono a Préstamo
              </legend>
              {activeLoan && (
                <span className="text-xs text-slate-500">
                  Saldo pendiente crédito:{' '}
                  <strong className="text-slate-900 tabular-nums">{formatCOP(activeLoan.outstandingPrincipal)}</strong>
                </span>
              )}
            </div>

            {loadingLoans ? (
              <p className="text-xs text-slate-500 py-3">Cargando créditos del asociado…</p>
            ) : loans.length === 0 ? (
              <Alert tone="info">El asociado seleccionado no tiene préstamos activos pendientes.</Alert>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Selector de préstamo si tiene más de uno */}
                {loans.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-700">Seleccionar crédito:</span>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {loans.map((l) => (
                        <label
                          key={l.id}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                            l.id === loanId ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500' : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="activeLoanRadio"
                              className="accent-indigo-600"
                              checked={l.id === loanId}
                              onChange={() => {
                                setLoanId(l.id);
                                setSelectedInstallments({});
                              }}
                            />
                            <span className="font-bold text-slate-900">Préstamo {l.loanNumber}</span>
                          </span>
                          <span className="font-semibold text-slate-700 tabular-nums">{formatCOP(l.outstandingPrincipal)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan de cuotas a abonar */}
                {activeLoan && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Seleccione las cuotas a pagar (se amortizan en orden):</span>
                      <StatusBadge status={activeLoan.portfolioStatus} />
                    </div>

                    <InstallmentPicker
                      lines={activeLoan.installments ?? []}
                      selected={selectedInstallments}
                      lastSelectedId={lastSelectedId}
                      onToggle={toggleLine}
                      onAmount={(id, v) => setSelectedInstallments((prev) => ({ ...prev, [id]: v }))}
                    />

                    {selectedInstallmentsCount > 0 && (
                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs sm:grid-cols-4">
                        <div>
                          <span className="text-slate-500">Capital abonado:</span>
                          <p className="font-bold text-slate-900 tabular-nums">{formatCOP(loanSummary.principal)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Interés abonado:</span>
                          <p className="font-bold text-slate-900 tabular-nums">{formatCOP(loanSummary.interest)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Subtotal préstamo:</span>
                          <p className="font-extrabold text-indigo-700 tabular-nums">{formatCOP(loanSummary.total)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Saldo después:</span>
                          <p className="font-bold text-slate-900 tabular-nums">
                            {formatCOP(Math.max(0, activeLoan.outstandingPrincipal - loanSummary.principal))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </fieldset>
        )}

        {/* 6. Banner de Total a Recibir */}
        <div className="flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-white">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-400">Total a Recibir</span>
            {mode === 'COMBINED' && (
              <span className="text-[11px] text-slate-400">
                Cuotas: {formatCOP(quotaTotal, '$0')} + Préstamo: {formatCOP(loanSummary.total, '$0')}
              </span>
            )}
          </div>
          <span className="text-xl font-extrabold tabular-nums">{formatCOP(grandTotal, '$0')}</span>
        </div>
      </div>
    </Modal>
  );
};

export const QuotaReceiptDocument: React.FC<{ receipt: AssociateReceipt; documentId: string; showPreview?: boolean }> = ({
  receipt,
  documentId,
  showPreview,
}) => {
  const loanPaid = receipt.loanPayment;
  const loanPrincipal = loanPaid?.principalApplied ?? 0;
  const loanInterest = loanPaid?.interestApplied ?? 0;
  const loanTotal = loanPrincipal + loanInterest;
  const grandTotal = receipt.totalAmount + loanTotal;

  return (
    <PrintDocumentLayout
      documentId={documentId}
      showPreview={showPreview}
      title="Recibo de caja · Cuotas y recaudos"
      documentNumber={receipt.receiptNumber}
      meta={[
        { label: 'Fecha', value: formatDate(receipt.paymentDate) },
        { label: 'Asociado', value: receipt.thirdPartyName },
        { label: 'Documento', value: receipt.thirdPartyIdNumber },
        { label: 'Recibido en', value: `${receipt.cashAccountCode} - ${receipt.cashAccountName}` },
        { label: 'Comprobante contable', value: receipt.voucherNumber ?? '—' },
        { label: 'Plantilla', value: receipt.templateName ?? '—' },
      ]}
      footer={
        <>
          {receipt.notes && (
            <p>
              <strong>Observaciones:</strong> {receipt.notes}
            </p>
          )}
          <SignatureBlock labels={['Elaborado por', 'Recibí conforme (asociado)']} />
        </>
      }
    >
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Clasificación</th>
            <th>Cuenta PUC</th>
            <th className="num">Valor</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((i, idx) => (
            <tr key={i.id ?? idx}>
              <td>{i.conceptName}</td>
              <td>{CATEGORY_LABELS[i.category] ?? i.category}</td>
              <td>
                {i.accountCode}
                {i.accountName ? ` - ${i.accountName}` : ''}
              </td>
              <td className="num">{formatCOP(i.amount)}</td>
            </tr>
          ))}

          {loanPaid && (
            <>
              <tr className="bg-slate-50 font-medium">
                <td colSpan={4} className="py-2 text-xs uppercase tracking-wider text-slate-500">
                  Abono a Préstamo ({loanPaid.loanNumber ?? 'Crédito'})
                </td>
              </tr>
              <tr>
                <td>Amortización de Capital</td>
                <td>Préstamo a asociado</td>
                <td>130505 - Préstamos a asociados</td>
                <td className="num">{formatCOP(loanPrincipal)}</td>
              </tr>
              {loanInterest > 0 && (
                <tr>
                  <td>Intereses Corrientes</td>
                  <td>Ingresos por intereses</td>
                  <td>417005 - Intereses sobre préstamos</td>
                  <td className="num">{formatCOP(loanInterest)}</td>
                </tr>
              )}
            </>
          )}

          <tr className="row-total">
            <td colSpan={3}>TOTAL RECIBIDO</td>
            <td className="num">{formatCOP(grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </PrintDocumentLayout>
  );
};
