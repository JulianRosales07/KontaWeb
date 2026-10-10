import type { CustomerAging } from './CustomerAging';

export interface ReceivableAgingReport {
  asOfDate: string;
  totalReceivables: number;
  totalCurrent: number;
  total1To30: number;
  total31To60: number;
  total61To90: number;
  totalOver90: number;
  customerCount: number;
  documentCount: number;
  customers: CustomerAging[];
}
