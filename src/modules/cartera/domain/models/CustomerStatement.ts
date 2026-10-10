export interface DebtDocument {
  id: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  documentNumber: string;
  thirdPartyId?: string;
  thirdPartyName?: string;
  thirdPartyIdentification?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  retentionTotal: number;
  totalAmount: number;
  remainingBalance: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  voucherId?: string;
  voucherNumber?: string;
}

export interface CustomerStatement {
  thirdPartyId: string;
  identificationNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  totalInvoiced: number;
  totalPaid: number;
  currentBalance: number;
  totalInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  documents: DebtDocument[];
}
