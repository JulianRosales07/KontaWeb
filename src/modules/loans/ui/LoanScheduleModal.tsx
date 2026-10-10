import React, { useEffect, useState } from 'react';
import { HandCoins, Printer } from 'lucide-react';
import { loanApi, paymentMethodLabel, type Loan, type LoanPaymentReceipt, type ScheduleLine } from '../api/loanApi';
import { useAuth } from '../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../shared/infrastructure/http/apiError';
import { formatCOP, formatDate, formatPercent } from '../../../shared/lib/format';
import { Modal } from '../../../shared/ui/components/Modal';
import { Alert, StatCard, buttonClass } from '../../../shared/ui/components/PageHeader';
import { ResponsiveTable, type TableColumn } from '../../../shared/ui/components/ResponsiveTable';
import { StatusBadge } from '../../../shared/ui/components/StatusBadge';
import { PrintDocumentLayout, usePrintDocument } from '../../../shared/ui/components/PrintDocumentLayout';

const statusLabel: Record<string, string> = { PAID: 'Pagada', PARTIAL: 'Parcial', PENDING: 'Pendiente' };

const installmentBadge = (l: ScheduleLine) =>
  l.overdue && l.status !== 'PAID' ? <StatusBadge label={`Vencida · ${l.daysOverdue} d`} tone="danger" /> : <StatusBadge status={l.status} />;

interface Props {
  loanId: string | null;
  onClose: () => void;
  /** Abre el formulario de abono para este préstamo. */
  onRegisterPayment?: (loan: Loan) => void;
}

export const LoanScheduleModal: React.FC<Props> = ({ loanId, onClose, onRegisterPayment }) => {
  const { hasPermission } = useAuth();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<LoanPaymentReceipt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { documentId, print } = usePrintDocument();

  useEffect(() => {
    if (!loanId) {
      setLoan(null);
      return;
    }
    setError(null);
    Promise.all([loanApi.get(loanId), loanApi.payments(loanId)])
      .then(([l, p]) => {
        setLoan(l);
        setPayments(p);
      })
      .catch((e) => setError(apiErrorMessage(e, 'No se pudo cargar el préstamo.')));
  }, [loanId]);

  const lines = loan?.installments ?? [];

  const columns: TableColumn<ScheduleLine>[] = [
    { key: 'number', header: 'Cuota', render: (l) => <span className="font-semibold">{l.number}</span>, hideOnMobile: true },
    { key: 'dueDate', header: 'Vencimiento', render: (l) => formatDate(l.dueDate) },
    { key: 'opening', header: 'Saldo inicial', align: 'right', render: (l) => formatCOP(l.openingBalance) },
    { key: 'principal', header: 'Capital', align: 'right', render: (l) => formatCOP(l.principal) },
    { key: 'interest', header: 'Interés', align: 'right', render: (l) => formatCOP(l.interest) },
    { key: 'total', header: 'Valor cuota', align: 'right', render: (l) => <strong>{formatCOP(l.total)}</strong> },
    { key: 'closing', header: 'Saldo final', align: 'right', render: (l) => formatCOP(l.closingBalance) },
    { key: 'pending', header: 'Pendiente', align: 'right', render: (l) => (l.pending > 0 ? formatCOP(l.pending) : '—') },
    { key: 'status', header: 'Estado', render: installmentBadge },
  ];

  const canPay = loan?.status === 'ACTIVE' && hasPermission('COLLECTIONS_CREATE') && !!onRegisterPayment;

  return (
    <Modal
      open={!!loanId}
      onClose={onClose}
      size="full"
      title={loan ? `Plan de pagos · ${loan.loanNumber}` : 'Plan de pagos'}
      subtitle={loan ? `${loan.thirdPartyName} · ${loan.thirdPartyIdNumber}` : undefined}
      footer={
        loan && (
          <>
            <button type="button" className={buttonClass.secondary} onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className={buttonClass.secondary} onClick={print}>
              <Printer size={16} /> Imprimir plan de pagos
            </button>
            {canPay && (
              <button type="button" className={buttonClass.primary} onClick={() => onRegisterPayment!(loan)}>
                <HandCoins size={16} /> Registrar abono
              </button>
            )}
          </>
        )
      }
    >
      {error && <Alert tone="error">{error}</Alert>}
      {!loan && !error && <p className="py-8 text-center text-sm text-slate-500">Cargando…</p>}
      {loan && (
        <div className="flex flex-col gap-5">
          {loan.legacy && (
            <Alert tone="warning">
              Préstamo histórico importado: su plan se conserva tal como fue registrado originalmente
              {loan.amortizationType === 'FRENCH' ? ' (cuota fija)' : ''} y no se recalculó.
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <StatCard label="Valor inicial" value={formatCOP(loan.principalAmount)} hint={`Desembolso ${formatDate(loan.disbursementDate)}`} />
            <StatCard label="Saldo de capital" value={formatCOP(loan.outstandingPrincipal)} tone="primary" hint={`Capital pagado ${formatCOP(loan.paidPrincipal)}`} />
            <StatCard label="Intereses" value={formatCOP(loan.paidInterest)} tone="positive" hint={`Pagados de ${formatCOP(loan.totalInterest)}`} />
            <StatCard
              label="Cuotas"
              value={`${loan.paidInstallments} / ${loan.termMonths}`}
              tone={loan.portfolioStatus === 'EN_MORA' ? 'negative' : 'neutral'}
              hint={loan.nextDueDate ? `Próxima ${formatDate(loan.nextDueDate)} · ${formatCOP(loan.nextDueAmount)}` : 'Sin cuotas pendientes'}
            />
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Tasa" value={`${formatPercent(loan.monthlyRate)} mensual sobre saldo`} />
            <Info label="Método" value={loan.amortizationType === 'CONSTANT_PRINCIPAL' ? 'Abono constante a capital' : 'Cuota fija (histórico)'} />
            <Info label="Estado" value={<StatusBadge status={loan.portfolioStatus} />} />
            <Info label="Cuenta cartera" value={loan.loanAccountCode ? `${loan.loanAccountCode} - ${loan.loanAccountName ?? ''}` : '—'} />
            <Info label="Cuenta intereses" value={loan.interestAccountCode ? `${loan.interestAccountCode} - ${loan.interestAccountName ?? ''}` : '—'} />
            <Info label="Comprobante desembolso" value={loan.disbursementVoucherNumber ?? '—'} />
          </dl>

          <section>
            <h4 className="mb-2 text-sm font-bold text-slate-900">Cuotas</h4>
            <ResponsiveTable
              columns={columns}
              rows={lines}
              rowKey={(l) => String(l.number)}
              dense
              minWidth={900}
              cardTitle={(l) => (
                <span className="flex items-center justify-between gap-2">
                  <span>Cuota {l.number}</span>
                  <span className="tabular-nums">{formatCOP(l.total)}</span>
                </span>
              )}
              rowClassName={(l) => (l.status === 'PAID' ? 'bg-emerald-50/40' : l.overdue ? 'bg-red-50/40' : '')}
              footer={
                <tr>
                  <td className="px-3 py-2 text-xs font-bold uppercase" colSpan={3}>
                    Totales
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(loan.principalAmount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(loan.totalInterest)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCOP(loan.totalPayable)}</td>
                  <td colSpan={3} />
                </tr>
              }
            />
          </section>

          <section>
            <h4 className="mb-2 text-sm font-bold text-slate-900">Abonos registrados</h4>
            {payments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">Aún no hay abonos.</p>
            ) : (
              <ResponsiveTable
                columns={[
                  { key: 'date', header: 'Fecha', render: (p: LoanPaymentReceipt) => formatDate(p.paymentDate) },
                  { key: 'receipt', header: 'Recibo', render: (p) => <span className="font-mono text-xs">{p.receiptNumber}</span> },
                  { key: 'inst', header: 'Cuotas', render: (p) => p.lines.map((l) => l.installmentNumber).join(', ') },
                  { key: 'method', header: 'Medio', render: (p) => paymentMethodLabel(p.paymentMethod) },
                  { key: 'principal', header: 'Capital', align: 'right', render: (p) => formatCOP(p.principalApplied) },
                  { key: 'interest', header: 'Interés', align: 'right', render: (p) => formatCOP(p.interestApplied) },
                  { key: 'total', header: 'Total', align: 'right', render: (p) => <strong>{formatCOP(p.totalAmount)}</strong> },
                  { key: 'voucher', header: 'Comprobante', render: (p) => <span className="font-mono text-xs">{p.voucherNumber ?? '—'}</span> },
                ]}
                rows={payments}
                rowKey={(p) => p.receiptNumber}
                dense
                cardTitle={(p) => `${p.receiptNumber} · ${formatDate(p.paymentDate)}`}
              />
            )}
          </section>

          <PrintDocumentLayout
            documentId={documentId}
            title="Plan de Pagos"
            documentNumber={loan.loanNumber}
            meta={[
              { label: 'Asociado', value: loan.thirdPartyName },
              { label: 'Documento', value: loan.thirdPartyIdNumber },
              { label: 'Número de préstamo', value: loan.loanNumber },
              { label: 'Fecha de desembolso', value: formatDate(loan.disbursementDate) },
              { label: 'Valor inicial', value: formatCOP(loan.principalAmount) },
              { label: 'Tasa', value: `${formatPercent(loan.monthlyRate)} mensual` },
              { label: 'Número de cuotas', value: loan.termMonths },
              { label: 'Saldo actual', value: formatCOP(loan.outstandingPrincipal) },
              { label: 'Método', value: loan.amortizationType === 'CONSTANT_PRINCIPAL' ? 'Interés sobre saldo de capital' : 'Cuota fija' },
            ]}
            footer={
              <p className="print-doc-muted">
                El interés de cada cuota se calcula sobre el saldo de capital pendiente al inicio del periodo. Solo el capital disminuye el saldo del préstamo.
              </p>
            }
          >
            <table>
              <thead>
                <tr>
                  <th>Cuota</th>
                  <th>Fecha</th>
                  <th className="num">Saldo inicial</th>
                  <th className="num">Capital</th>
                  <th className="num">Interés</th>
                  <th className="num">Valor cuota</th>
                  <th className="num">Saldo final</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.number}>
                    <td>{l.number}</td>
                    <td>{formatDate(l.dueDate)}</td>
                    <td className="num">{formatCOP(l.openingBalance)}</td>
                    <td className="num">{formatCOP(l.principal)}</td>
                    <td className="num">{formatCOP(l.interest)}</td>
                    <td className="num">{formatCOP(l.total)}</td>
                    <td className="num">{formatCOP(l.closingBalance)}</td>
                    <td>{l.overdue && l.status !== 'PAID' ? 'Vencida' : statusLabel[l.status]}</td>
                  </tr>
                ))}
                <tr className="row-total">
                  <td colSpan={3}>TOTALES</td>
                  <td className="num">{formatCOP(loan.principalAmount)}</td>
                  <td className="num">{formatCOP(loan.totalInterest)}</td>
                  <td className="num">{formatCOP(loan.totalPayable)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </PrintDocumentLayout>
        </div>
      )}
    </Modal>
  );
};

const Info: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
    <dd className="break-words font-medium text-slate-900">{value}</dd>
  </div>
);
