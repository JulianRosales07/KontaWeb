import React from 'react';
import { paymentMethodLabel, type LoanPaymentReceipt } from '../api/loanApi';
import { formatCOP, formatDate } from '../../../shared/lib/format';
import { PrintDocumentLayout, SignatureBlock } from '../../../shared/ui/components/PrintDocumentLayout';

const statusLabel: Record<string, string> = { PAID: 'Pagada', PARTIAL: 'Parcial', PENDING: 'Pendiente' };

/** Recibo de caja por abono a préstamo (documento imprimible). */
export const LoanPaymentReceiptDocument: React.FC<{ receipt: LoanPaymentReceipt; documentId: string; showPreview?: boolean }> = ({
  receipt,
  documentId,
  showPreview,
}) => (
  <PrintDocumentLayout
    documentId={documentId}
    showPreview={showPreview}
    title="Recibo de caja · Abono a préstamo"
    documentNumber={receipt.receiptNumber}
    meta={[
      { label: 'Fecha', value: formatDate(receipt.paymentDate) },
      { label: 'Asociado', value: receipt.thirdPartyName },
      { label: 'Documento', value: receipt.thirdPartyIdNumber },
      { label: 'Préstamo', value: receipt.loanNumber },
      { label: 'Medio de pago', value: paymentMethodLabel(receipt.paymentMethod) },
      { label: 'Comprobante externo', value: receipt.reference || '—' },
      { label: 'Cuenta que recibe', value: receipt.cashAccountCode ? `${receipt.cashAccountCode} - ${receipt.cashAccountName ?? ''}` : '—' },
      { label: 'Comprobante contable', value: receipt.voucherNumber ?? '—' },
      { label: 'Elaborado por', value: receipt.createdBy || '—' },
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
          <th>Cuota</th>
          <th>Vencimiento</th>
          <th className="num">Capital</th>
          <th className="num">Interés</th>
          <th className="num">Total abonado</th>
          <th>Estado cuota</th>
        </tr>
      </thead>
      <tbody>
        {receipt.lines.map((l) => (
          <tr key={l.installmentId}>
            <td>{l.installmentNumber}</td>
            <td>{formatDate(l.dueDate)}</td>
            <td className="num">{formatCOP(l.principal)}</td>
            <td className="num">{formatCOP(l.interest)}</td>
            <td className="num">{formatCOP(l.amount)}</td>
            <td>{statusLabel[l.installmentStatus]}</td>
          </tr>
        ))}
        <tr className="row-total">
          <td colSpan={2}>TOTAL RECIBIDO</td>
          <td className="num">{formatCOP(receipt.principalApplied)}</td>
          <td className="num">{formatCOP(receipt.interestApplied)}</td>
          <td className="num">{formatCOP(receipt.totalAmount)}</td>
          <td />
        </tr>
      </tbody>
    </table>
    <p className="print-doc-section-title">Saldo de capital del préstamo después del abono: {formatCOP(receipt.loanOutstandingAfter)}</p>
  </PrintDocumentLayout>
);
