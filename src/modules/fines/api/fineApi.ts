import { httpClient } from '../../../shared/infrastructure/http/httpClient';

export type FineStatus = 'PENDING' | 'PAID' | 'VOIDED';

export const FINE_STATUS_LABELS: Record<FineStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  VOIDED: 'Condonada',
};

export interface FineType {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  active: boolean;
  /** Tiene multas registradas (al eliminarlo solo se desactiva). */
  used: boolean;
}

export interface FineTypeInput {
  name: string;
  description?: string | null;
  amount: number;
  active: boolean;
}

export interface Fine {
  id: string;
  thirdPartyId: string;
  thirdPartyName: string;
  thirdPartyDocument: string;
  fineTypeId: string;
  fineTypeName: string;
  fineDate: string;
  amount: number;
  description?: string | null;
  status: FineStatus;
  paidDate?: string | null;
  receiptNumber?: string | null;
  voucherId?: string | null;
  voidReason?: string | null;
}

export interface FineSummary {
  pendingCount: number;
  pendingTotal: number;
  paidCount: number;
  paidTotal: number;
  voidedCount: number;
  voidedTotal: number;
  associatesWithPending: number;
}

const clean = (p: Record<string, unknown>) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const fineApi = {
  types: () => httpClient.get<FineType[]>('/fines/types').then((r) => r.data),
  createType: (body: FineTypeInput) => httpClient.post<FineType>('/fines/types', body).then((r) => r.data),
  updateType: (id: string, body: FineTypeInput) => httpClient.put<FineType>(`/fines/types/${id}`, body).then((r) => r.data),
  deleteType: (id: string) => httpClient.delete(`/fines/types/${id}`),

  list: (params: { status?: FineStatus; thirdPartyId?: string; fineTypeId?: string; from?: string; to?: string }) =>
    httpClient.get<Fine[]>('/fines', { params: clean(params) }).then((r) => r.data),
  summary: (thirdPartyId?: string) => httpClient.get<FineSummary>('/fines/summary', { params: clean({ thirdPartyId }) }).then((r) => r.data),

  register: (body: { fineTypeId: string; fineDate: string; description?: string; amount?: number | null; thirdPartyIds: string[] }) =>
    httpClient.post<{ created: number; skipped: string[]; total: number }>('/fines', body).then((r) => r.data),
  pay: (body: { fineIds: string[]; paymentDate: string; cashAccountCode: string }) =>
    httpClient.post<{ receipts: string[]; finesPaid: number; total: number }>('/fines/pay', body).then((r) => r.data),
  void: (id: string, reason: string) => httpClient.post<Fine>(`/fines/${id}/void`, { reason }).then((r) => r.data),
};
