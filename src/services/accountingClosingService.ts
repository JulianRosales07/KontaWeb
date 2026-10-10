import { apiClient } from './api';

export type PeriodStatus = 'OPEN' | 'CLOSED';

export interface AccountingPeriodResponse {
  id: string;
  year: number;
  month: number;
  status: PeriodStatus;
  closedAt?: string;
  closedBy?: string;
}

export interface AnnualClosingResponse {
  year: number;
  voucherNumber: string;
  voucherId: string;
  totalRevenues: number;
  totalExpensesAndCosts: number;
  netResult: number;
  resultType: 'UTILIDAD' | 'PERDIDA' | 'EQUILIBRIO';
  destinationAccountCode: string;
  message: string;
}

export interface ReverseVoucherResponse {
  id: string;
  voucherNumber: string;
  voucherType: string;
  status: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
}

export const accountingClosingService = {
  // Periodos Contables
  async getPeriods(): Promise<AccountingPeriodResponse[]> {
    const response = await apiClient.get<AccountingPeriodResponse[]>('/closing/periods');
    return response.data;
  },

  async openPeriod(year: number, month: number): Promise<AccountingPeriodResponse> {
    const response = await apiClient.post<AccountingPeriodResponse>('/closing/periods/open', {
      year,
      month,
    });
    return response.data;
  },

  async closePeriod(year: number, month: number, closedBy?: string): Promise<AccountingPeriodResponse> {
    const response = await apiClient.post<AccountingPeriodResponse>('/closing/periods/close', {
      year,
      month,
      closedBy,
    });
    return response.data;
  },

  // Cierre Anual de Cuentas de Resultado
  async executeAnnualClosing(year: number): Promise<AnnualClosingResponse> {
    const response = await apiClient.post<AnnualClosingResponse>(`/closing/annual/${year}`);
    return response.data;
  },

  // Reversión de Comprobante Contable
  async reverseVoucher(voucherId: string): Promise<ReverseVoucherResponse> {
    const response = await apiClient.post<ReverseVoucherResponse>(`/vouchers/${voucherId}/reverse`);
    return response.data;
  },
};
