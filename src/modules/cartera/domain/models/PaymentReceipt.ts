export interface PaymentReceipt {
  id: string;
  paymentType: 'CASH_IN' | 'CASH_OUT';
  receiptNumber: string;
  paymentDate: string;
  debtDocumentId?: string;
  debtDocumentNumber?: string;
  thirdPartyName?: string;
  cashAccountCode: string;
  cashAccountName: string;
  amountPaid: number;
  remainingDocumentBalance?: number;
  documentStatus?: string;
  voucherId?: string;
  voucherNumber?: string;
}
