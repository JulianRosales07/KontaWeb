import { httpClient } from '../../../shared/infrastructure/http/httpClient';

export interface ReportColumn {
  key: string;
  label: string;
  type: 'TEXT' | 'MONEY' | 'DATE' | 'NUMBER' | 'PERCENT';
  summable: boolean;
}

export interface ReportRow {
  rowType: 'DETAIL' | 'GROUP' | 'SUBTOTAL';
  /** Las claves que empiezan por "_" son metadatos para navegar (_voucherId, _partyId, _accountCode, _level). */
  cells: Record<string, string | number | null>;
}

export interface FinancialReport {
  code: string;
  title: string;
  subtitle?: string;
  organizationName: string;
  organizationNit?: string;
  periodFrom: string;
  periodTo: string;
  generatedAt: string;
  generatedBy: string;
  filters: Record<string, string>;
  summary: { label: string; value: number; type: 'MONEY' | 'NUMBER'; tone: string }[];
  columns: ReportColumn[];
  rows: ReportRow[];
  totals: Record<string, number>;
}

export interface ReportFilters {
  from?: string;
  to?: string;
  accountCode?: string;
  voucherType?: string;
  thirdPartyId?: string;
  paymentMethod?: string;
  /** Nivel PUC máximo (1 clase … 5 auxiliar). */
  level?: number;
  /** Balance de prueba con detalle por tercero. */
  byParty?: boolean;
}

export interface ReportCatalogItem {
  code: string;
  title: string;
  group: string;
  excelSheet: string;
}

export interface DashboardData {
  kpis: Record<
    'cash' | 'banks' | 'investments' | 'receivables' | 'contributions' | 'extraContributions' | 'solidarityFund' | 'tourismFund'
    | 'assets' | 'liabilities' | 'equity' | 'income' | 'expenses' | 'result',
    number
  >;
  monthly: { month: string; income: number; expenses: number; collections: number }[];
  incomeComposition: { code: string; label: string; value: number }[];
  expenseComposition: { code: string; label: string; value: number }[];
  balanceComposition: { label: string; value: number }[];
}

export interface MonthlyImportResult {
  fileName: string;
  period: string | null;
  organizationName: string | null;
  dryRun: boolean;
  applied: boolean;
  message: string;
  accountsCreated: string[];
  associatesCreated: string[];
  associatesMatched: number;
  vouchers: { number: string; type: string; date: string; description: string; total: number; lines: number }[];
  reconciliation: { report: string; sheet: string; concept: string; excel: number; system: number; difference: number; ok: boolean }[];
  warnings: string[];
  errors: string[];
}

export interface Investment {
  id: string;
  entityName: string;
  instrumentType: string;
  instrumentNumber?: string | null;
  accountCode: string;
  accountName: string;
  principal: number;
  accruedInterest: number;
  total: number;
  annualRate?: number | null;
  startDate?: string | null;
  maturityDate?: string | null;
  status: 'ACTIVE' | 'REDEEMED';
  notes?: string | null;
}

export type InvestmentInput = Omit<Investment, 'id' | 'accountName' | 'total'>;

const clean = (f: ReportFilters) =>
  Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const reportApi = {
  catalog: () => httpClient.get<ReportCatalogItem[]>('/reports/financial').then((r) => r.data),

  dashboard: (from?: string, to?: string) =>
    httpClient.get<DashboardData>('/reports/financial/dashboard', { params: clean({ from, to }) }).then((r) => r.data),

  generate: (code: string, filters: ReportFilters) =>
    httpClient.get<FinancialReport>(`/reports/financial/${code}`, { params: clean(filters) }).then((r) => r.data),

  /** Descarga el PDF/Excel generado por el servidor (documento real, no captura de pantalla). */
  async download(code: string, format: 'pdf' | 'xlsx', filters: ReportFilters) {
    const res = await httpClient.get<Blob>(`/reports/financial/${code}/export`, {
      params: { ...clean(filters), format },
      responseType: 'blob',
      timeout: 60000,
    });
    const disposition = String(res.headers['content-disposition'] ?? '');
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const filename = match?.[1] ?? `reporte-${code.toLowerCase()}.${format}`;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};

/** Importador del informe mensual (Excel). dryRun = simular y conciliar sin guardar. */
export const monthlyImportApi = {
  async run(file: File, dryRun: boolean): Promise<MonthlyImportResult> {
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await httpClient.post<MonthlyImportResult>('/importers/monthly-report', form, {
        params: { dryRun },
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      });
      return res.data;
    } catch (e) {
      // 422: la importación no se realizó pero la respuesta trae errores y conciliación
      const data = (e as { response?: { status?: number; data?: MonthlyImportResult } }).response;
      if (data?.status === 422 && data.data) return data.data;
      throw e;
    }
  },
};

export const investmentApi = {
  list: () => httpClient.get<Investment[]>('/investments').then((r) => r.data),
  create: (body: InvestmentInput) => httpClient.post<Investment>('/investments', body).then((r) => r.data),
  update: (id: string, body: InvestmentInput) => httpClient.put<Investment>(`/investments/${id}`, body).then((r) => r.data),
  remove: (id: string) => httpClient.delete(`/investments/${id}`),
};
