import { httpClient } from '../../../shared/infrastructure/http/httpClient';

/** Fila del directorio de asociados (backend /associates/directory y /associates/payables). */
export interface AssociateSummary {
  id: string;
  associateCode?: string;
  fullName: string;
  idType?: string;
  identificationNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  classification?: string;
  associate: boolean;
  status: 'ACTIVE' | 'INACTIVE' | string;
  activeLoans: number;
  loansBalance: number;
  contributions: number;
  savings: number;
  payableBalance: number;
  movements: number;
  lastMovementDate?: string;
}

export interface DirectoryFilters {
  q?: string;
  status?: string;
  idType?: string;
  associatesOnly?: boolean;
  hasLoan?: boolean;
  hasSavings?: boolean;
  hasContributions?: boolean;
}

export interface PartyPayload {
  identificationNumber: string;
  dv?: string;
  fullName: string;
  email?: string;
  phone?: string;
  type: 'NATURAL' | 'JURIDICA';
  idType?: string;
  address?: string;
  classification?: string;
  associate?: boolean;
  associateCode?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

const clean = (f: object) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const directoryApi = {
  search: (filters: DirectoryFilters = {}) =>
    httpClient.get<AssociateSummary[]>('/associates/directory', { params: clean(filters) }).then((r) => r.data),

  payables: (q?: string) =>
    httpClient.get<AssociateSummary[]>('/associates/payables', { params: clean({ q }) }).then((r) => r.data),

  createParty: (p: PartyPayload) => httpClient.post('/parties', p).then((r) => r.data),

  updateParty: (id: string, p: PartyPayload) => httpClient.put(`/parties/${id}`, p).then((r) => r.data),

  importLocal: (items: {
    identificationNumber: string;
    fullName: string;
    dv?: string;
    idType?: string;
    email?: string;
    phone?: string;
    address?: string;
    classification?: string;
    status?: string;
  }[]) => httpClient.post<{ imported: number; skipped: number; messages: string[] }>('/associates/directory/import', { items }).then((r) => r.data),
};

/** Tipos de documento usados en Colombia. */
export const ID_TYPES = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'PPT', label: 'Permiso por protección temporal' },
];

export const idTypeLabel = (v?: string) => ID_TYPES.find((t) => t.value === v)?.label ?? v ?? '—';
