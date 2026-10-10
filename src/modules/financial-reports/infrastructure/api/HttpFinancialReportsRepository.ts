import type { AxiosInstance } from 'axios';
import type { FinancialReportsRepository } from '../../domain/ports/out/FinancialReportsRepository';
import type {
  PartyTrialBalanceReport,
  PartyIncomeStatementReport,
  PartyBalanceSheetReport,
} from '../../domain/models/FinancialReports';
import { NetworkError } from '../../../../shared/domain/errors/DomainError';

export class HttpFinancialReportsRepository implements FinancialReportsRepository {
  private readonly http: AxiosInstance;
  private readonly fallbackRepo?: FinancialReportsRepository;

  constructor(http: AxiosInstance, fallbackRepo?: FinancialReportsRepository) {
    this.http = http;
    this.fallbackRepo = fallbackRepo;
  }

  public async getPartyTrialBalance(
    startDate?: string,
    endDate?: string,
    partyId?: string
  ): Promise<PartyTrialBalanceReport> {
    try {
      const response = await this.http.get<PartyTrialBalanceReport>(
        '/reports/trial-balance-by-party',
        { params: { startDate, endDate, partyId } }
      );
      return response.data;
    } catch (error) {
      if (this.fallbackRepo) {
        console.warn('HttpFinancialReportsRepository: Backend offline, fallback mock...');
        return this.fallbackRepo.getPartyTrialBalance(startDate, endDate, partyId);
      }
      throw new NetworkError('Error al obtener el balance de prueba por terceros.');
    }
  }

  public async getPartyIncomeStatement(
    startDate?: string,
    endDate?: string,
    partyId?: string
  ): Promise<PartyIncomeStatementReport> {
    try {
      const response = await this.http.get<PartyIncomeStatementReport>(
        '/reports/income-statement-by-party',
        { params: { startDate, endDate, partyId } }
      );
      return response.data;
    } catch (error) {
      if (this.fallbackRepo) {
        return this.fallbackRepo.getPartyIncomeStatement(startDate, endDate, partyId);
      }
      throw new NetworkError('Error al obtener el estado de resultados por terceros.');
    }
  }

  public async getPartyBalanceSheet(asOfDate?: string): Promise<PartyBalanceSheetReport> {
    try {
      const response = await this.http.get<PartyBalanceSheetReport>(
        '/reports/balance-sheet-by-party',
        { params: { asOfDate } }
      );
      return response.data;
    } catch (error) {
      if (this.fallbackRepo) {
        return this.fallbackRepo.getPartyBalanceSheet(asOfDate);
      }
      throw new NetworkError('Error al obtener el balance general por terceros.');
    }
  }
}
