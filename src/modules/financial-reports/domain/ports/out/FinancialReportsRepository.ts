import type {
  PartyTrialBalanceReport,
  PartyIncomeStatementReport,
  PartyBalanceSheetReport,
} from '../../models/FinancialReports';

export interface FinancialReportsRepository {
  getPartyTrialBalance(
    startDate?: string,
    endDate?: string,
    partyId?: string
  ): Promise<PartyTrialBalanceReport>;

  getPartyIncomeStatement(
    startDate?: string,
    endDate?: string,
    partyId?: string
  ): Promise<PartyIncomeStatementReport>;

  getPartyBalanceSheet(asOfDate?: string): Promise<PartyBalanceSheetReport>;
}
