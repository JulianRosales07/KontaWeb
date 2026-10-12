export type EventType = 'RIFA' | 'BINGO' | 'BAZAR' | 'DONACION' | 'ACTIVIDAD' | 'OTRO';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  RIFA: 'Rifa',
  BINGO: 'Bingo',
  BAZAR: 'Bazar / Venta de comida',
  DONACION: 'Donación',
  ACTIVIDAD: 'Actividad pro-fondos',
  OTRO: 'Otro evento',
};

export const EVENT_TYPE_ICONS: Record<EventType, string> = {
  RIFA: '🎟️',
  BINGO: '🎲',
  BAZAR: '🍲',
  DONACION: '🤝',
  ACTIVIDAD: '⭐',
  OTRO: '📋',
};

export interface EventCashReceipt {
  id: string;
  receiptNumber: string;
  voucherId?: string;
  voucherNumber: string;
  eventType: EventType;
  eventName: string;
  paymentDate: string; // YYYY-MM-DD
  cashAccountCode: string;
  cashAccountName: string;
  incomeAccountCode: string;
  incomeAccountName: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  deliveredBy: string;
  thirdPartyId?: string;
  thirdPartyName?: string;
  notes?: string;
  receivedBy?: string;
  createdAt: string;
}

export interface CreateEventReceiptPayload {
  receiptNumber: string;
  eventType: EventType;
  eventName: string;
  paymentDate: string;
  cashAccountCode: string;
  cashAccountName: string;
  incomeAccountCode: string;
  incomeAccountName: string;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER';
  deliveredBy: string;
  thirdPartyId?: string;
  thirdPartyName?: string;
  notes?: string;
  receivedBy?: string;
}
