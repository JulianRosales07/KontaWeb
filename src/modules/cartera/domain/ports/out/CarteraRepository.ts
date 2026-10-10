import type { ReceivableAgingReport } from '../../models/ReceivableAgingReport';
import type { CustomerStatement } from '../../models/CustomerStatement';
import type { PaymentReceipt } from '../../models/PaymentReceipt';

export interface CarteraRepository {
  getReceivablesAging(asOfDate: string): Promise<ReceivableAgingReport>;
  getCustomerStatement(customerId: string): Promise<CustomerStatement>;
  getDocumentPayments(docId: string): Promise<PaymentReceipt[]>;
}
