import React from 'react';
import type { EventCashReceipt } from '../types/eventReceipt';
import { EVENT_TYPE_LABELS } from '../types/eventReceipt';
import { PrintDocumentLayout, SignatureBlock } from '../../../shared/ui/components/PrintDocumentLayout';
import { formatCOP, formatDate } from '../../../shared/lib/format';

export const EventReceiptDocument: React.FC<{
  receipt: EventCashReceipt;
  documentId: string;
  showPreview?: boolean;
}> = ({ receipt, documentId, showPreview }) => {
  return (
    <PrintDocumentLayout
      documentId={documentId}
      showPreview={showPreview}
      title="Recibo de Caja · Ingreso por Evento o Actividad"
      documentNumber={receipt.receiptNumber}
      meta={[
        { label: 'Fecha de ingreso', value: formatDate(receipt.paymentDate) },
        { label: 'Tipo de actividad', value: `${EVENT_TYPE_LABELS[receipt.eventType] ?? 'Evento'} - ${receipt.eventName}` },
        { label: 'Entregado por', value: receipt.deliveredBy || receipt.thirdPartyName || 'Responsable de la actividad' },
        { label: 'Ingresado en', value: `${receipt.cashAccountCode} - ${receipt.cashAccountName}` },
        { label: 'Medio de pago', value: receipt.paymentMethod === 'CASH' ? 'Efectivo en caja' : 'Transferencia bancaria' },
        { label: 'Comprobante contable', value: receipt.voucherNumber || '—' },
      ]}
      footer={
        <>
          {receipt.notes && (
            <p className="mt-2 text-xs text-slate-600">
              <strong>Observaciones / Detalle:</strong> {receipt.notes}
            </p>
          )}
          <div className="mt-4 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
            <span>Certifica el ingreso de los fondos recaudados en la actividad a la caja de la entidad.</span>
          </div>
          <SignatureBlock labels={['Entregó conforme (Organizador / Responsable)', 'Recibió conforme (Tesorero / Caja)']} />
        </>
      }
    >
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th>Concepto del ingreso</th>
            <th>Cuenta PUC</th>
            <th>Tipo movimiento</th>
            <th className="num">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Ingreso a Caja</strong> ({receipt.eventName})
            </td>
            <td>
              {receipt.cashAccountCode} - {receipt.cashAccountName}
            </td>
            <td>Débito (Entrada a caja)</td>
            <td className="num font-semibold">{formatCOP(receipt.amount)}</td>
          </tr>
          <tr>
            <td>
              <strong>Ingreso por {EVENT_TYPE_LABELS[receipt.eventType]}</strong>
            </td>
            <td>
              {receipt.incomeAccountCode} - {receipt.incomeAccountName}
            </td>
            <td>Crédito (Ingreso operacional/diverso)</td>
            <td className="num font-semibold">{formatCOP(receipt.amount)}</td>
          </tr>
          <tr className="row-total">
            <td colSpan={3}>TOTAL DINERO INGRESADO A CAJA</td>
            <td className="num font-bold text-base text-indigo-700">{formatCOP(receipt.amount)}</td>
          </tr>
        </tbody>
      </table>
    </PrintDocumentLayout>
  );
};
