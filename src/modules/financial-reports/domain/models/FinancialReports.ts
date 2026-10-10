export interface PartyTrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNature: 'DEBIT' | 'CREDIT';
  partyId?: string;
  partyIdentification?: string;
  partyName?: string;
  initialBalance: number;
  periodDebit: number;
  periodCredit: number;
  finalBalance: number;
}

export interface PartyTrialBalanceReport {
  startDate: string;
  endDate: string;
  totalInitialDebit: number;
  totalInitialCredit: number;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  totalFinalDebit: number;
  totalFinalCredit: number;
  items: PartyTrialBalanceItem[];
}

export interface FinancialReportItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: 'DEBIT' | 'CREDIT';
  debit: number;
  credit: number;
  netBalance: number;
}

export interface PartyIncomeItem {
  partyId?: string;
  partyIdentification?: string;
  partyName?: string;
  totalRevenues: number;
  totalCosts: number;
  grossProfit: number;
  totalExpenses: number;
  netResult: number;
  revenueItems: FinancialReportItem[];
  costItems: FinancialReportItem[];
  expenseItems: FinancialReportItem[];
}

export interface PartyIncomeStatementReport {
  startDate: string;
  endDate: string;
  totalRevenues: number;
  totalCosts: number;
  grossProfit: number;
  totalExpenses: number;
  netOperatingIncome: number;
  parties: PartyIncomeItem[];
}

export interface PartyBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: 'DEBIT' | 'CREDIT';
  partyId?: string;
  partyIdentification?: string;
  partyName?: string;
  debit: number;
  credit: number;
  netBalance: number;
}

export interface PartyBalanceSheetReport {
  asOfDate: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  periodIncome: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  assetItems: PartyBalanceItem[];
  liabilityItems: PartyBalanceItem[];
  equityItems: PartyBalanceItem[];
}

export type ReportTabType = 'trial-balance' | 'income-statement' | 'balance-sheet';
