/**
 * Préstamos que la versión anterior guardaba solo en el navegador (localStorage).
 * Se importan al backend una única vez y SIN recalcular su plan de pagos.
 */
const LEGACY_LOANS_KEY = 'konta_associate_loans_v1';
const LEGACY_PARTIES_KEY = 'konta_third_parties_v1';
const IMPORTED_FLAG = 'konta_legacy_loans_imported_v1';

interface LegacyInstallment {
  installmentNumber: number;
  dueDate: string;
  totalInstallment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  paidDate?: string;
  paidAmount?: number;
}

export interface LegacyLoan {
  id: string;
  loanNumber: string;
  thirdPartyId: string;
  thirdPartyName: string;
  thirdPartyIdNumber: string;
  principalAmount: number;
  interestRateMonthly: number;
  termMonths: number;
  disbursementDate: string;
  firstPaymentDate: string;
  amortizationType: string;
  currentBalance: number;
  schedule: LegacyInstallment[];
  notes?: string;
}

/** Préstamos locales reales (excluye los de demostración que la versión anterior creaba automáticamente). */
export function readLegacyLoans(): LegacyLoan[] {
  try {
    const raw = localStorage.getItem(LEGACY_LOANS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l: LegacyLoan) => l && typeof l.id === 'string' && !l.id.startsWith('loan-seed-') && Array.isArray(l.schedule));
  } catch {
    return [];
  }
}

export function legacyImportDone(): boolean {
  return localStorage.getItem(IMPORTED_FLAG) === 'true';
}

export function markLegacyImportDone() {
  localStorage.setItem(IMPORTED_FLAG, 'true');
}

/** Documento real del asociado (la versión anterior a veces guardaba solo su id local). */
function resolveIdentification(loan: LegacyLoan): string {
  if (loan.thirdPartyIdNumber) return loan.thirdPartyIdNumber;
  try {
    const parties = JSON.parse(localStorage.getItem(LEGACY_PARTIES_KEY) || '[]');
    const p = parties.find((x: { id?: string; idNumber?: string }) => x.id === loan.thirdPartyId);
    if (p?.idNumber) return p.idNumber;
  } catch {
    /* sin datos locales */
  }
  return loan.thirdPartyId;
}

export function toImportPayload(loans: LegacyLoan[]) {
  return loans.map((l) => ({
    loanNumber: l.loanNumber,
    associateIdentification: resolveIdentification(l),
    associateName: l.thirdPartyName,
    principalAmount: l.principalAmount,
    monthlyRate: l.interestRateMonthly,
    termMonths: l.termMonths,
    amortizationType: l.amortizationType,
    disbursementDate: l.disbursementDate,
    firstPaymentDate: l.firstPaymentDate,
    notes: l.notes,
    installments: l.schedule.map((s) => ({
      number: s.installmentNumber,
      dueDate: s.dueDate,
      principal: s.principal,
      interest: s.interest,
      total: s.totalInstallment,
      remainingBalance: s.remainingBalance,
      status: s.status,
      paidAmount: s.paidAmount,
      paidDate: s.paidDate,
    })),
  }));
}
