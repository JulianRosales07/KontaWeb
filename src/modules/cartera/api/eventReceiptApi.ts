import { voucherApi } from '../../contabilidad/api/voucherApi';
import type { CreateEventReceiptPayload, EventCashReceipt } from '../types/eventReceipt';
import { EVENT_TYPE_LABELS } from '../types/eventReceipt';

const STORAGE_KEY = 'konta_event_cash_receipts_v1';

export const eventReceiptApi = {
  /**
   * Obtiene la lista de recibos de caja de eventos guardados.
   */
  async list(): Promise<EventCashReceipt[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list: EventCashReceipt[] = JSON.parse(raw);
      return Array.isArray(list) ? list.sort((a, b) => (b.paymentDate > a.paymentDate ? 1 : -1)) : [];
    } catch {
      return [];
    }
  },

  /**
   * Registra el recibo de caja de ingreso y genera el asiento contable (INGRESO) con partida doble.
   */
  async create(payload: CreateEventReceiptPayload): Promise<EventCashReceipt> {
    const receiptNumber = payload.receiptNumber.trim().toUpperCase();
    const eventLabel = EVENT_TYPE_LABELS[payload.eventType] ?? 'Evento';
    const description = `Recibo de Caja ${receiptNumber}: Ingreso por ${eventLabel} - ${payload.eventName}${
      payload.deliveredBy ? ` (Entregó: ${payload.deliveredBy})` : ''
    }`;

    // 1. Asiento contable de partida doble en el motor contable
    // Débito: Caja General (110505) -> ingresa dinero a caja
    // Crédito: Ingresos por eventos (429581) -> reconoce el ingreso
    const voucherRequest = {
      voucherNumber: receiptNumber,
      voucherType: 'INGRESO' as const,
      issueDate: payload.paymentDate,
      description,
      status: 'POSTED' as const,
      entries: [
        {
          accountCode: payload.cashAccountCode,
          thirdPartyId: payload.thirdPartyId,
          referenceNumber: receiptNumber,
          description: `Ingreso a caja por ${eventLabel}: ${payload.eventName}`,
          debit: payload.amount,
          credit: 0,
        },
        {
          accountCode: payload.incomeAccountCode,
          thirdPartyId: payload.thirdPartyId,
          referenceNumber: receiptNumber,
          description: `Ingreso por ${eventLabel}: ${payload.eventName}`,
          debit: 0,
          credit: payload.amount,
        },
      ],
    };

    let voucherId: string | undefined;
    let voucherNumber = receiptNumber;

    try {
      const createdVoucher = await voucherApi.create(voucherRequest);
      voucherId = createdVoucher.id;
      voucherNumber = createdVoucher.voucherNumber;
    } catch (err: any) {
      // Si el número de comprobante ya existe con ese exacto consecutivo en vouchers,
      // intentar con prefijo CI- para no bloquear la operación
      if (err?.response?.data?.message?.includes?.('Ya existe')) {
        const altNumber = `CI-${receiptNumber}`;
        const altVoucher = await voucherApi.create({
          ...voucherRequest,
          voucherNumber: altNumber,
        });
        voucherId = altVoucher.id;
        voucherNumber = altVoucher.voucherNumber;
      } else {
        throw err;
      }
    }

    // 2. Guardar el registro del recibo de evento
    const receipt: EventCashReceipt = {
      id: `evt-rc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      receiptNumber,
      voucherId,
      voucherNumber,
      eventType: payload.eventType,
      eventName: payload.eventName,
      paymentDate: payload.paymentDate,
      cashAccountCode: payload.cashAccountCode,
      cashAccountName: payload.cashAccountName,
      incomeAccountCode: payload.incomeAccountCode,
      incomeAccountName: payload.incomeAccountName,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      deliveredBy: payload.deliveredBy,
      thirdPartyId: payload.thirdPartyId,
      thirdPartyName: payload.thirdPartyName,
      notes: payload.notes,
      receivedBy: payload.receivedBy,
      createdAt: new Date().toISOString(),
    };

    const current = await this.list();
    const updated = [receipt, ...current.filter((r) => r.receiptNumber !== receiptNumber)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return receipt;
  },

  /**
   * Sugiere el siguiente número consecutivo de recibo de caja (ej. RC-0001, RC-0002...).
   */
  async nextReceiptNumber(): Promise<string> {
    const list = await this.list();
    let max = 0;
    for (const r of list) {
      const m = r.receiptNumber.match(/(\d+)$/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
    const next = max + 1;
    return `RC-${String(next).padStart(4, '0')}`;
  },
};
