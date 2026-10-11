import React, { useEffect, useState } from 'react';
import { loanApi, type Loan, type LoanPreview } from '../api/loanApi';
import type { AssociateSummary } from '../../associates/infrastructure/directoryApi';
import { AssociatePicker } from '../../associates/ui/components/AssociatePicker';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { addMonthsISO, formatCOP, formatDate, todayISO } from '../../../shared/lib/format';
import { Modal } from '../../../shared/ui/components/Modal';
import { Alert, buttonClass } from '../../../shared/ui/components/PageHeader';
import { FormField, MoneyInput, NumberInput, inputClass, selectClass } from '../../../shared/ui/components/MoneyInput';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (loan: Loan) => void;
  initialAssociate?: AssociateSummary | null;
}

const DISBURSEMENT_ACCOUNTS = [
  { code: '110505', label: '110505 - Caja general' },
  { code: '111005', label: '111005 - Bancos (moneda nacional)' },
];

export const CreateLoanModal: React.FC<Props> = ({ open, onClose, onCreated, initialAssociate = null }) => {
  const [associate, setAssociate] = useState<AssociateSummary | null>(initialAssociate);
  const [principal, setPrincipal] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);
  const [disbursementDate, setDisbursementDate] = useState(todayISO());
  const [firstPaymentDate, setFirstPaymentDate] = useState(addMonthsISO(todayISO(), 1));
  const [disbursementAccount, setDisbursementAccount] = useState('110505');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<LoanPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setAssociate(initialAssociate);
      setPrincipal(null);
      setRate(null);
      setTerm(null);
      setDisbursementDate(todayISO());
      setFirstPaymentDate(addMonthsISO(todayISO(), 1));
      setDisbursementAccount('110505');
      setNotes('');
      setPreview(null);
      setError(null);
      setSubmitted(false);
    }
  }, [open, initialAssociate]);

  // Vista previa calculada en el servidor (misma lógica que se guarda)
  useEffect(() => {
    if (!open || !principal || rate === null || !term || !firstPaymentDate) {
      setPreview(null);
      return;
    }
    const handle = setTimeout(() => {
      loanApi
        .preview({ principalAmount: principal, monthlyRate: rate, termMonths: term, firstPaymentDate })
        .then((p) => {
          setPreview(p);
          setPreviewError(null);
        })
        .catch((e) => {
          setPreview(null);
          setPreviewError(apiErrorMessage(e, 'No se pudo calcular el plan.'));
        });
    }, 350);
    return () => clearTimeout(handle);
  }, [open, principal, rate, term, firstPaymentDate]);

  const errors = {
    associate: !associate ? 'Seleccione el asociado' : null,
    principal: !principal || principal <= 0 ? 'Ingrese el valor del préstamo' : null,
    rate: rate === null || rate < 0 ? 'Ingrese la tasa mensual' : rate > 10 ? 'Verifique la tasa: supera el 10% mensual' : null,
    term: !term || term < 1 ? 'Ingrese el número de cuotas' : term > 360 ? 'Máximo 360 cuotas' : null,
    dates: firstPaymentDate < disbursementDate ? 'La primera cuota no puede vencer antes del desembolso' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = async () => {
    setSubmitted(true);
    if (hasErrors || !associate || !principal || rate === null || !term) return;
    setSaving(true);
    setError(null);
    try {
      const loan = await loanApi.create({
        thirdPartyId: associate.id,
        principalAmount: principal,
        monthlyRate: rate,
        termMonths: term,
        disbursementDate,
        firstPaymentDate,
        disbursementAccountCode: disbursementAccount,
        notes: notes.trim() || undefined,
      });
      onCreated(loan);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudo crear el préstamo.'));
    } finally {
      setSaving(false);
    }
  };

  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={saving}
      size="xl"
      title="Nuevo préstamo"
      subtitle="Amortización bajo saldo de capital: capital fijo por cuota e interés sobre el saldo pendiente."
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="button" className={buttonClass.primary} onClick={submit} disabled={saving}>
            {saving ? 'Desembolsando…' : 'Crear y desembolsar'}
          </button>
        </>
      }
    >
      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <form
          className="flex min-w-0 flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {error && <Alert tone="error">{error}</Alert>}
          <FormField label="Asociado" required htmlFor="loan-associate" error={show('associate')}>
            <AssociatePicker id="loan-associate" value={associate} onChange={setAssociate} />
          </FormField>
          <FormField label="Valor del préstamo" required htmlFor="loan-principal" error={show('principal')}>
            <MoneyInput id="loan-principal" value={principal} onChange={setPrincipal} invalid={!!show('principal')} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2">
            <FormField label="Tasa mensual" required htmlFor="loan-rate" error={show('rate')}>
              <NumberInput id="loan-rate" value={rate} onChange={setRate} decimals suffix="%" placeholder="Ej. 2" invalid={!!show('rate')} />
            </FormField>
            <FormField label="Número de cuotas" required htmlFor="loan-term" error={show('term')}>
              <NumberInput id="loan-term" value={term} onChange={setTerm} suffix="cuotas" placeholder="Ej. 10" invalid={!!show('term')} />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2">
            <FormField label="Fecha de desembolso" required htmlFor="loan-disb">
              <input
                id="loan-disb"
                type="date"
                className={inputClass}
                value={disbursementDate}
                onChange={(e) => {
                  setDisbursementDate(e.target.value);
                  if (e.target.value) setFirstPaymentDate(addMonthsISO(e.target.value, 1));
                }}
              />
            </FormField>
            <FormField label="Primera cuota" required htmlFor="loan-first" error={show('dates')}>
              <input id="loan-first" type="date" className={inputClass} value={firstPaymentDate} onChange={(e) => setFirstPaymentDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Sale de" htmlFor="loan-account" hint="Cuenta de caja o banco desde la que se entrega el dinero.">
            <select id="loan-account" className={selectClass} value={disbursementAccount} onChange={(e) => setDisbursementAccount(e.target.value)}>
              {DISBURSEMENT_ACCOUNTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Observaciones" htmlFor="loan-notes">
            <textarea id="loan-notes" rows={2} className={`${inputClass} h-auto py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </FormField>
          <button type="submit" className="hidden" />
        </form>

        <section className="flex min-w-0 flex-col gap-3">
          <h4 className="text-sm font-bold text-slate-900">Plan de pagos proyectado</h4>
          {previewError && <Alert tone="error">{previewError}</Alert>}
          {!preview ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              Ingrese valor, tasa, cuotas y fecha de la primera cuota para ver el plan.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Mini label="Capital por cuota" value={formatCOP(preview.principalPerInstallment)} />
                <Mini label="Primera cuota" value={formatCOP(preview.firstInstallment)} />
                <Mini label="Total intereses" value={formatCOP(preview.totalInterest)} />
                <Mini label="Total a pagar" value={formatCOP(preview.totalPayable)} />
              </div>
              <div className="table-scroll max-h-[50dvh] overflow-y-auto rounded-lg border border-slate-200">
                <table className="table-stack w-full min-w-[620px] text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-right">Saldo inicial</th>
                      <th className="px-3 py-2 text-right">Capital</th>
                      <th className="px-3 py-2 text-right">Interés</th>
                      <th className="px-3 py-2 text-right">Cuota</th>
                      <th className="px-3 py-2 text-right">Saldo final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.schedule.map((l) => (
                      <tr key={l.number} className="border-t border-slate-100">
                        <td className="px-3 py-1.5 font-semibold">{l.number}</td>
                        <td className="whitespace-nowrap px-3 py-1.5">{formatDate(l.dueDate)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{formatCOP(l.openingBalance)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{formatCOP(l.principal)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{formatCOP(l.interest)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right font-semibold tabular-nums">{formatCOP(l.total)}</td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums">{formatCOP(l.closingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </Modal>
  );
};

const Mini: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="truncate text-[11px] font-semibold text-slate-500">{label}</p>
    <p className="truncate font-bold tabular-nums text-slate-900">{value}</p>
  </div>
);
