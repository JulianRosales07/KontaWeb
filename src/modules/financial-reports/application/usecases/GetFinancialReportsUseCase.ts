import type { FinancialReportsRepository } from '../../domain/ports/out/FinancialReportsRepository';
import type {
  PartyTrialBalanceReport,
  PartyIncomeStatementReport,
  PartyBalanceSheetReport,
} from '../../domain/models/FinancialReports';

export class GetFinancialReportsUseCase {
  private readonly repository: FinancialReportsRepository;

  constructor(repository: FinancialReportsRepository) {
    this.repository = repository;
  }

  public getTrialBalance(
    startDate?: string,
    endDate?: string,
    partyId?: string
  ): Promise<PartyTrialBalanceReport> {
    return this.repository.getPartyTrialBalance(startDate, endDate, partyId);
  }

  public getIncomeStatement(
    startDate?: string,
    endDate?: string,
    partyId?: string
  ): Promise<PartyIncomeStatementReport> {
    return this.repository.getPartyIncomeStatement(startDate, endDate, partyId);
  }

  public getBalanceSheet(asOfDate?: string): Promise<PartyBalanceSheetReport> {
    return this.repository.getPartyBalanceSheet(asOfDate);
  }
}
