import { httpClient } from '../http/httpClient';

export interface DatabaseCleanupOptions {
  cleanAssociateReceipts: boolean;
  cleanLoans: boolean;
  cleanDebtAndTreasury: boolean;
  cleanJournalVouchers: boolean;
  cleanThirdParties: boolean;
  cleanQuotaTemplates: boolean;
}

export interface DatabaseCleanupResult {
  message: string;
  deletedCounts: Record<string, number>;
}

export const systemMaintenanceApi = {
  async cleanupDatabase(options: DatabaseCleanupOptions): Promise<DatabaseCleanupResult> {
    const res = await httpClient.post<DatabaseCleanupResult>('/system/database-cleanup', options);
    return res.data;
  },
};
