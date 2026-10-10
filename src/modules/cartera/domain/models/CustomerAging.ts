import type { AgingDocumentItem } from './AgingDocument';

export interface CustomerAging {
  thirdPartyId: string;
  identificationNumber: string;
  fullName: string;
  phone?: string;
  email?: string;
  totalBalance: number;
  currentBalance: number;
  balance1To30: number;
  balance31To60: number;
  balance61To90: number;
  balanceOver90: number;
  documents: AgingDocumentItem[];
  isLoan?: boolean;
  loanId?: string;
  loanNumber?: string;
  loanAccountCode?: string;
}
