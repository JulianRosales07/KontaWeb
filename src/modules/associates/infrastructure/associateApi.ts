import { httpClient } from '../../../shared/infrastructure/http/httpClient';
import type {
  QuotaTemplate,
  AssociateReceipt,
  AssociateStatement,
  QuotaCategory,
} from '../types/associate';

const LOCAL_TEMPLATE_KEY = 'konta_quota_templates_v1';

export interface QuotaReceiptPayload {
  thirdPartyId: string;
  templateId?: string;
  paymentDate: string;
  cashAccountCode: string;
  totalAmount: number;
  notes?: string;
  items: { conceptName: string; category: QuotaCategory; accountCode: string; amount: number }[];
  /** Multas pendientes del asociado que se pagan en este recibo (el backend agrega las líneas a 429510). */
  fineIds?: string[];
  loanPayment?: {
    loanId: string;
    paymentMethod?: string;
    allocations: { installmentId: string; amount: number }[];
  };
}

/**
 * Recaudos de cuotas, aportes y fondos de asociados. El backend es la única fuente de verdad:
 * cada recibo genera su comprobante contable de ingreso.
 */
export const associateApi = {
  /**
   * Plantillas de cuota. Si el servidor no tiene plantillas activas se usa la configurada en
   * "Configuración de Cuotas" (esa pantalla conserva su funcionamiento actual).
   */
  async getTemplates(): Promise<QuotaTemplate[]> {
    try {
      const res = await httpClient.get<QuotaTemplate[]>('/associates/templates');
      if (res.data?.length) return res.data;
    } catch {
      // se intenta con la configuración local
    }
    try {
      const local = localStorage.getItem(LOCAL_TEMPLATE_KEY);
      if (local) return [JSON.parse(local)];
    } catch {
      /* sin configuración local */
    }
    return [];
  },

  async registerReceipt(payload: QuotaReceiptPayload): Promise<AssociateReceipt> {
    const res = await httpClient.post<AssociateReceipt>('/associates/receipts', payload);
    return res.data;
  },

  async getReceipts(page = 0, size = 100): Promise<AssociateReceipt[]> {
    const res = await httpClient.get<{ content: AssociateReceipt[] }>('/associates/receipts', { params: { page, size } });
    return res.data?.content ?? [];
  },

  async getReceiptsByAssociate(thirdPartyId: string): Promise<AssociateReceipt[]> {
    const res = await httpClient.get<AssociateReceipt[]>(`/associates/${thirdPartyId}/receipts`);
    return res.data ?? [];
  },

  async getStatement(thirdPartyId: string): Promise<AssociateStatement | null> {
    const res = await httpClient.get<AssociateStatement>(`/associates/${thirdPartyId}/statement`);
    return res.data ?? null;
  },

  async sendReceiptEmail(receiptId: string): Promise<void> {
    await httpClient.post(`/associates/receipts/${receiptId}/send-email`);
  },
};

export const CATEGORY_LABELS: Record<string, string> = {
  INCOME: 'Ingreso (sostenimiento)',
  EQUITY_SAVING: 'Aporte social',
  SAVINGS: 'Ahorro del asociado',
  SOCIAL_FUND: 'Fondo social',
  LOAN_PAYMENT: 'Préstamo',
  LOAN_PRINCIPAL: 'Capital préstamo',
  LOAN_INTEREST: 'Interés préstamo',
};
