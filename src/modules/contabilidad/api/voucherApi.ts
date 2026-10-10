import { httpClient } from '../../../shared/infrastructure/http/httpClient';

export type VoucherType = 'INGRESO' | 'EGRESO' | 'NOTA_CONTABLE' | 'APERTURA';
export type VoucherStatus = 'DRAFT' | 'POSTED' | 'VOIDED';

export interface JournalEntry {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  thirdPartyId?: string;
  thirdPartyIdentification?: string;
  thirdPartyName?: string;
  referenceNumber?: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalVoucher {
  id: string;
  voucherNumber: string;
  voucherType: VoucherType;
  issueDate: string;
  description: string;
  status: VoucherStatus;
  totalDebit: number;
  totalCredit: number;
  createdAt?: string;
  createdBy?: string;
  entries: JournalEntry[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  INGRESO: 'Comprobante de ingreso',
  EGRESO: 'Comprobante de egreso',
  NOTA_CONTABLE: 'Nota contable',
  APERTURA: 'Comprobante de apertura',
};

export const voucherApi = {
  list: (params: { startDate?: string; endDate?: string; type?: string; status?: string; q?: string; page?: number; size?: number }) =>
    httpClient
      .get<Page<JournalVoucher>>('/vouchers', {
        params: Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
      })
      .then((r) => r.data),

  get: (id: string) => httpClient.get<JournalVoucher>(`/vouchers/${id}`).then((r) => r.data),

  reverse: (id: string, reason?: string) =>
    httpClient.post<JournalVoucher>(`/vouchers/${id}/reverse`, null, { params: reason ? { reason } : {} }).then((r) => r.data),
};

/** Diferencia en pesos entre débitos y créditos (0 = cuadrado). */
export const voucherDifference = (v: Pick<JournalVoucher, 'totalDebit' | 'totalCredit'>) =>
  Math.round((Number(v.totalDebit) - Number(v.totalCredit)) * 100) / 100;

/** Tercero principal del comprobante (el primero que aparezca en sus líneas). */
export const mainThirdParty = (v: JournalVoucher) => v.entries.find((e) => e.thirdPartyName) ?? null;
