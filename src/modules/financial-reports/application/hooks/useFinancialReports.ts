import { useState, useEffect, useCallback } from 'react';
import type {
  PartyTrialBalanceReport,
  PartyIncomeStatementReport,
  PartyBalanceSheetReport,
  ReportTabType,
} from '../../domain/models/FinancialReports';
import { useFinancialReportsDependencies } from '../../di/FinancialReportsContext';

export function useFinancialReports() {
  const { reportsUseCase } = useFinancialReportsDependencies();

  const [reportTab, setReportTab] = useState<ReportTabType>('trial-balance');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [trialData, setTrialData] = useState<PartyTrialBalanceReport | null>(null);
  const [incomeData, setIncomeData] = useState<PartyIncomeStatementReport | null>(null);
  const [balanceData, setBalanceData] = useState<PartyBalanceSheetReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (reportTab === 'trial-balance') {
        const data = await reportsUseCase.getTrialBalance(startDate, endDate);
        setTrialData(data);
      } else if (reportTab === 'income-statement') {
        const data = await reportsUseCase.getIncomeStatement(startDate, endDate);
        setIncomeData(data);
      } else if (reportTab === 'balance-sheet') {
        const data = await reportsUseCase.getBalanceSheet(asOfDate);
        setBalanceData(data);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al obtener los reportes financieros.');
    } finally {
      setLoading(false);
    }
  }, [reportsUseCase, reportTab, startDate, endDate, asOfDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reportTab,
    setReportTab,
    loading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    asOfDate,
    setAsOfDate,
    searchTerm,
    setSearchTerm,
    trialData,
    incomeData,
    balanceData,
    refetch: fetchReports,
  };
}
