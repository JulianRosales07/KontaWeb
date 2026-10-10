export type QuotaCategory =
  | 'INCOME'
  | 'EQUITY_SAVING'
  | 'SAVINGS'
  | 'SOCIAL_FUND'
  | 'LOAN_PAYMENT'
  | 'LOAN_PRINCIPAL'
  | 'LOAN_INTEREST';

export interface QuotaTemplateItem {
  id: string;
  conceptName: string;
  category: QuotaCategory;
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  percentage?: number;
  isMandatory: boolean;
  displayOrder: number;
}

export interface QuotaTemplate {
  id: string;
  name: string;
  description: string;
  totalAmount: number;
  isActive: boolean;
  items: QuotaTemplateItem[];
}

export interface AssociateReceiptItem {
  id?: string;
  conceptName: string;
  category: QuotaCategory;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  amount: number;
}

export interface CreateAssociateReceiptRequest {
  thirdPartyId: string;
  templateId?: string;
  paymentDate: string;
  cashAccountId: string;
  totalAmount: number;
  items: {
    conceptName: string;
    category: QuotaCategory;
    accountId: string;
    amount: number;
  }[];
  notes?: string;
  loanId?: string;
}

export interface AssociateReceipt {
  id: string;
  receiptNumber: string;
  thirdPartyId: string;
  thirdPartyName: string;
  thirdPartyIdNumber: string;
  pucAccountCode?: string;
  pucAccountName?: string;
  templateId?: string;
  templateName?: string;
  paymentDate: string;
  totalAmount: number;
  cashAccountId: string;
  cashAccountCode: string;
  cashAccountName: string;
  voucherId?: string;
  voucherNumber?: string;
  notes?: string;
  createdAt: string;
  items: AssociateReceiptItem[];
  loanId?: string;
  loanPayment?: any;
}

export interface AssociateStatement {
  thirdPartyId: string;
  fullName: string;
  identificationNumber: string;
  pucAccountCode?: string;
  pucAccountName?: string;
  email?: string;
  phone?: string;
  totalEquitySavings: number;
  totalSavings?: number;
  totalSocialFunds: number;
  totalAdministrationFees: number;
  totalPaidOverall: number;
  receiptsHistory: AssociateReceipt[];
  activeLoansCount?: number;
  totalLoansBalance?: number;
}

/* ========================================================================= */
/* LOAN & PAYMENT SCHEDULE TYPES (Préstamos a Asociados y Tablas de Pagos)   */
/* ========================================================================= */

export type LoanStatus = 'ACTIVE' | 'PAID' | 'DEFAULTED' | 'CANCELLED';
export type InstallmentStatus = 'PENDING' | 'PAID' | 'PARTIAL';
export type AmortizationType = 'FRENCH' | 'CONSTANT_PRINCIPAL';

export interface LoanInstallment {
  installmentNumber: number;
  dueDate: string;
  totalInstallment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: InstallmentStatus;
  paidDate?: string;
  paidAmount?: number;
  receiptNumber?: string;
}

export interface AssociateLoan {
  id: string;
  loanNumber: string; // e.g. "PREST-0001"
  thirdPartyId: string;
  thirdPartyName: string;
  thirdPartyIdNumber: string;
  principalAmount: number;
  interestRateMonthly: number; // e.g. 1.5% mens.
  termMonths: number;
  disbursementDate: string;
  firstPaymentDate: string;
  amortizationType: AmortizationType;
  status: LoanStatus;
  loanAccountCode: string; // e.g. "136505" (Préstamos a Asociados / Cartera)
  loanAccountName?: string; // e.g. "Préstamos a Asociados / Cartera"
  interestAccountCode: string; // e.g. "421005" (Intereses Créditos)
  interestAccountName?: string; // e.g. "Intereses sobre Préstamos"
  monthlyPayment: number;
  totalInterest: number;
  totalPayable: number;
  currentBalance: number;
  paidPrincipal: number;
  paidInterest: number;
  paidInstallmentsCount: number;
  schedule: LoanInstallment[];
  notes?: string;
  createdAt: string;
}

export interface CreateLoanRequest {
  thirdPartyId: string;
  principalAmount: number;
  interestRateMonthly: number;
  termMonths: number;
  disbursementDate: string;
  firstPaymentDate: string;
  amortizationType: AmortizationType;
  loanAccountCode?: string;
  loanAccountName?: string;
  interestAccountCode?: string;
  interestAccountName?: string;
  disbursementAccountId?: string;
  notes?: string;
}
