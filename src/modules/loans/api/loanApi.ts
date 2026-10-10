import { httpClient } from '../../../shared/infrastructure/http/httpClient';

/** Cuota del plan de pagos (calculada y persistida por el backend: LoanAmortizationCalculator). */
export interface ScheduleLine {
  id?: string;
  number: number;
  dueDate: string;
  openingBalance: number;
  principal: number;
  interest: number;
  total: number;
  closingBalance: number;
  principalPaid: number;
  interestPaid: number;
  pending: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  paidDate?: string;
  overdue: boolean;
  daysOverdue: number;
}

export interface Loan {
  id: string;
  loanNumber: string;
  thirdPartyId: string;
  thirdPartyName: string;
  thirdPartyIdNumber: string;
  principalAmount: number;
  monthlyRate: number;
  termMonths: number;
  amortizationType: 'CONSTANT_PRINCIPAL' | 'FRENCH';
  disbursementDate: string;
  firstPaymentDate: string;
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
  portfolioStatus: 'AL_DIA' | 'EN_MORA' | 'PAGADO' | 'ANULADO';
  outstandingPrincipal: number;
  paidPrincipal: number;
  paidInterest: number;
  totalInterest: number;
  totalPayable: number;
  firstInstallmentAmount: number;
  paidInstallments: number;
  pendingInstallments: number;
  overdueInstallments: number;
  overdueAmount: number;
  nextDueDate?: string;
  nextDueAmount?: number;
  nextInstallmentNumber?: number;
  loanAccountCode?: string;
  loanAccountName?: string;
  interestAccountCode?: string;
  interestAccountName?: string;
  disbursementAccountCode?: string;
  disbursementVoucherNumber?: string;
  legacy: boolean;
  notes?: string;
  installments?: ScheduleLine[];
}

export interface LoanPreview {
  principalAmount: number;
  monthlyRate: number;
  termMonths: number;
  principalPerInstallment: number;
  firstInstallment: number;
  totalInterest: number;
  totalPayable: number;
  schedule: ScheduleLine[];
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CONSIGNMENT' | 'PAYROLL_DEDUCTION' | 'OTHER';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; defaultAccount: string }[] = [
  { value: 'CASH', label: 'Efectivo', defaultAccount: '110505' },
  { value: 'TRANSFER', label: 'Transferencia', defaultAccount: '111005' },
  { value: 'CONSIGNMENT', label: 'Consignación', defaultAccount: '111005' },
  { value: 'PAYROLL_DEDUCTION', label: 'Descuento de nómina', defaultAccount: '111005' },
  { value: 'OTHER', label: 'Otro', defaultAccount: '110505' },
];

export const paymentMethodLabel = (m?: string) => PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m ?? '—';

export interface LoanPaymentReceipt {
  receiptNumber: string;
  paymentDate: string;
  loanId: string;
  loanNumber: string;
  thirdPartyId: string;
  thirdPartyName: string;
  thirdPartyIdNumber: string;
  paymentMethod: PaymentMethod;
  cashAccountCode?: string;
  cashAccountName?: string;
  voucherId?: string;
  voucherNumber?: string;
  reference?: string;
  notes?: string;
  totalAmount: number;
  principalApplied: number;
  interestApplied: number;
  loanOutstandingAfter: number;
  createdBy?: string;
  lines: {
    installmentId: string;
    installmentNumber: number;
    dueDate: string;
    amount: number;
    principal: number;
    interest: number;
    installmentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  }[];
}

export interface CreateLoanPayload {
  thirdPartyId: string;
  principalAmount: number;
  monthlyRate: number;
  termMonths: number;
  disbursementDate: string;
  firstPaymentDate: string;
  disbursementAccountCode?: string;
  loanAccountCode?: string;
  interestAccountCode?: string;
  notes?: string;
}

export interface LoanPaymentPayload {
  paymentDate: string;
  paymentMethod: PaymentMethod;
  cashAccountCode?: string;
  reference?: string;
  notes?: string;
  allocations: { installmentId: string; amount: number }[];
}

export const loanApi = {
  preview: (p: { principalAmount: number; monthlyRate: number; termMonths: number; firstPaymentDate: string }) =>
    httpClient.post<LoanPreview>('/loans/preview', p).then((r) => r.data),

  create: (p: CreateLoanPayload) => httpClient.post<Loan>('/loans', p).then((r) => r.data),

  list: (params: { status?: Loan['status']; thirdPartyId?: string; includeInstallments?: boolean } = {}) =>
    httpClient.get<Loan[]>('/loans', { params }).then((r) => r.data),

  get: (id: string) => httpClient.get<Loan>(`/loans/${id}`).then((r) => r.data),

  payments: (id: string) => httpClient.get<LoanPaymentReceipt[]>(`/loans/${id}/payments`).then((r) => r.data),

  paymentsBetween: (from: string, to: string) =>
    httpClient.get<LoanPaymentReceipt[]>('/loans/payments', { params: { from, to } }).then((r) => r.data),

  registerPayment: (loanId: string, p: LoanPaymentPayload) =>
    httpClient.post<LoanPaymentReceipt>(`/loans/${loanId}/payments`, p).then((r) => r.data),

  importLegacy: (loans: unknown[]) =>
    httpClient.post<{ imported: number; skipped: number; messages: string[] }>('/loans/import-legacy', { loans }).then((r) => r.data),
};

/**
 * Distribución informativa de un abono (interés primero, luego capital) — la misma regla del backend.
 * Solo se usa para mostrar la vista previa; los valores definitivos los devuelve el servidor.
 */
export function previewAllocation(amount: number, line: ScheduleLine) {
  const interestPending = line.interest - line.interestPaid;
  const principalPending = line.principal - line.principalPaid;
  const interest = Math.min(amount, interestPending);
  const principal = Math.max(0, Math.min(amount - interest, principalPending));
  return { interest, principal };
}
