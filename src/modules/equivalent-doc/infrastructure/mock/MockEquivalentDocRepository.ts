import type { EquivalentDocRepository } from '../../domain/ports/out/EquivalentDocRepository';
import type {
  EquivalentDocumentRequest,
  EquivalentDocumentResponse,
} from '../../domain/models/EquivalentDocument';

export class MockEquivalentDocRepository implements EquivalentDocRepository {
  public async createEquivalentDocument(
    data: EquivalentDocumentRequest
  ): Promise<EquivalentDocumentResponse> {
    await new Promise((r) => setTimeout(r, 300));

    const retentionTotal = data.subtotal * 0.04;
    const netAmount = data.subtotal - retentionTotal;

    return {
      documentType: 'DOCUMENTO_SOPORTE_ELECTRONICO',
      paidImmediately: data.payImmediately,
      debtDocument: {
        id: 'mock-doc-' + Date.now(),
        type: 'PAYABLE',
        documentNumber: data.documentNumber,
        thirdPartyIdentification: data.thirdPartyIdentification || '1020304050',
        thirdPartyName: 'PRESTADOR DE SERVICIOS INDEPENDIENTE',
        issueDate: data.issueDate,
        dueDate: data.dueDate || data.issueDate,
        subtotal: data.subtotal,
        taxTotal: 0,
        retentionTotal,
        totalAmount: netAmount,
        remainingBalance: data.payImmediately ? 0 : netAmount,
        status: data.payImmediately ? 'PAID' : 'PENDING',
        voucherNumber: data.payImmediately
          ? 'CE-' + data.documentNumber
          : 'CP-' + data.documentNumber,
      },
      journalVoucher: {
        voucherNumber: data.payImmediately
          ? 'CE-' + data.documentNumber
          : 'CP-' + data.documentNumber,
        voucherType: data.payImmediately ? 'EGRESO' : 'NOTA_CONTABLE',
      },
      taxCalculation: {
        subtotal: data.subtotal,
        totalAmount: netAmount,
      },
      paymentReceipt: data.payImmediately
        ? {
            id: 'mock-rec-' + Date.now(),
            paymentType: 'CASH_OUT',
            receiptNumber: 'REC-' + data.documentNumber,
            paymentDate: data.issueDate,
            cashAccountCode: data.cashAccountCode || '110505',
            cashAccountName: 'CAJA GENERAL',
            amountPaid: netAmount,
          }
        : undefined,
    };
  }
}
