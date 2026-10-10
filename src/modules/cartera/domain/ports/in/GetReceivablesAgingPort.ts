import type { ReceivableAgingReport } from '../../models/ReceivableAgingReport';

export interface GetReceivablesAgingQuery {
  asOfDate: string;
}

export interface GetReceivablesAgingPort {
  execute(query: GetReceivablesAgingQuery): Promise<ReceivableAgingReport>;
}
