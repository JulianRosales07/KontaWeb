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

export interface AgingDocumentItem {
  documentId: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  originalAmount: number;
  remainingBalance: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  bucket: 'CURRENT' | 'DAYS_1_TO_30' | 'DAYS_31_TO_60' | 'DAYS_61_TO_90' | 'OVER_90';
}

export interface CustomerAging {
  thirdPartyId: string;
  identificationNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  totalBalance: number;
  currentBalance: number;
  balance1To30: number;
  balance31To60: number;
  balance61To90: number;
  balanceOver90: number;
  documents: AgingDocumentItem[];
}

export interface ReceivableAgingReport {
  asOfDate: string;
  totalReceivables: number;
  totalCurrent: number;
  total1To30: number;
  total31To60: number;
  total61To90: number;
  totalOver90: number;
  customerCount: number;
  documentCount: number;
  customers: CustomerAging[];
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

export interface PartyTrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNature: 'DEBIT' | 'CREDIT';
  partyId?: string;
  partyIdentification?: string;
  partyName?: string;
  initialBalance: number;
  periodDebit: number;
  periodCredit: number;
  finalBalance: number;
}

export interface PartyTrialBalanceResponse {
  startDate: string;
  endDate: string;
  totalInitialDebit: number;
  totalInitialCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalFinalDebit: number;
  totalFinalCredit: number;
  items: PartyTrialBalanceItem[];
}

export interface FinancialReportItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: 'DEBIT' | 'CREDIT';
  debit: number;
  credit: number;
  netBalance: number;
}

export interface PartyIncomeItem {
  partyId?: string;
  partyIdentification?: string;
  partyName?: string;
  totalRevenues: number;
  totalCosts: number;
  grossProfit: number;
  totalExpenses: number;
  netResult: number;
  revenueItems: FinancialReportItem[];
  costItems: FinancialReportItem[];
  expenseItems: FinancialReportItem[];
}

export interface PartyIncomeStatementResponse {
  startDate: string;
  endDate: string;
  totalRevenues: number;
  totalCosts: number;
  grossProfit: number;
  totalExpenses: number;
  netOperatingIncome: number;
  parties: PartyIncomeItem[];
}

export interface PartyBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: 'DEBIT' | 'CREDIT';
  partyId?: string;
  partyIdentification?: string;
  partyName?: string;
  debit: number;
  credit: number;
  netBalance: number;
}

export interface PartyBalanceSheetResponse {
  asOfDate: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  periodIncome: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  assetItems: PartyBalanceItem[];
  liabilityItems: PartyBalanceItem[];
  equityItems: PartyBalanceItem[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email: string;
  fullName?: string;
  /** Rol principal; null cuando la cuenta está pendiente de aprobación. */
  role: string | null;
  roles?: string[];
  permissions?: string[];
  picture?: string;
  avatarUrl?: string;
  expiresIn: number;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: 'ROLE_ADMIN' | 'ROLE_CONTADOR' | 'ROLE_AUXILIAR';
  enabled: boolean;
  lastLogin?: string;
}
