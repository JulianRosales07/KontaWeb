export type AgingBucket =
  | 'CURRENT'
  | 'DAYS_1_TO_30'
  | 'DAYS_31_TO_60'
  | 'DAYS_61_TO_90'
  | 'OVER_90';

export type DocumentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface AgingDocumentItem {
  documentId: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  originalAmount: number;
  remainingBalance: number;
  status: DocumentStatus;
  bucket: AgingBucket;
}
