import type { DebtDocument } from '../../../cartera/domain/models/CustomerStatement';
import type { PaymentReceipt } from '../../../cartera/domain/models/PaymentReceipt';

export interface EquivalentDocumentRequest {
  documentNumber: string;
  thirdPartyId?: string;
  thirdPartyIdentification?: string;
  issueDate: string;
  dueDate?: string;
  expenseAccountCode: string;
  subtotal: number;
  taxTemplateIds: string[];
  description?: string;
  payImmediately: boolean;
  cashAccountId?: string;
  cashAccountCode?: string;
}

export interface EquivalentDocumentResponse {
  documentType: string;
  paidImmediately: boolean;
  debtDocument: DebtDocument;
  journalVoucher: any;
  taxCalculation: any;
  paymentReceipt?: PaymentReceipt;
}
