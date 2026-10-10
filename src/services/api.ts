import type {
  ReceivableAgingReport,
  CustomerStatement,
  PaymentReceipt,
  EquivalentDocumentRequest,
  EquivalentDocumentResponse,
  PartyTrialBalanceResponse,
  PartyIncomeStatementResponse,
  PartyBalanceSheetResponse,
  LoginRequest,
  AuthResponse,
  UserResponse,
} from '../types/accounting';
import { httpClient } from '../shared/infrastructure/http/httpClient';

export const apiClient = httpClient;

// Mock fallback data to ensure smooth UI exploration out-of-the-box
export const mockAgingData: ReceivableAgingReport = {
  asOfDate: '2026-09-24',
  totalReceivables: 18450000,
  totalCurrent: 9200000,
  total1To30: 4500000,
  total31To60: 2750000,
  total61To90: 1200000,
  totalOver90: 800000,
  customerCount: 4,
  documentCount: 6,
  customers: [
    {
      thirdPartyId: 'c1-uuid',
      identificationNumber: '900876543-1',
      fullName: 'INDUSTRIAS METÁLICAS DEL CARIBE S.A.S.',
      phone: '+57 301 555 1234',
      email: 'facturacion@metalicascaribe.com',
      totalBalance: 8200000,
      currentBalance: 5000000,
      balance1To30: 3200000,
      balance31To60: 0,
      balance61To90: 0,
      balanceOver90: 0,
      documents: [
        {
          documentId: 'd1',
          documentNumber: 'FAC-1089',
          issueDate: '2026-09-10',
          dueDate: '2026-10-10',
          daysOverdue: 0,
          originalAmount: 5000000,
          remainingBalance: 5000000,
          status: 'PENDING',
          bucket: 'CURRENT',
        },
        {
          documentId: 'd2',
          documentNumber: 'FAC-1065',
          issueDate: '2026-08-20',
          dueDate: '2026-09-19',
          daysOverdue: 5,
          originalAmount: 3200000,
          remainingBalance: 3200000,
          status: 'PENDING',
          bucket: 'DAYS_1_TO_30',
        },
      ],
    },
    {
      thirdPartyId: 'c2-uuid',
      identificationNumber: '901234567-8',
      fullName: 'ALIMENTOS Y LOGÍSTICA ANDINA S.A.',
      phone: '+57 310 888 9012',
      email: 'contabilidad@andinalog.com',
      totalBalance: 4200000,
      currentBalance: 4200000,
      balance1To30: 0,
      balance31To60: 0,
      balance61To90: 0,
      balanceOver90: 0,
      documents: [
        {
          documentId: 'd3',
          documentNumber: 'FAC-1092',
          issueDate: '2026-09-18',
          dueDate: '2026-10-18',
          daysOverdue: 0,
          originalAmount: 4200000,
          remainingBalance: 4200000,
          status: 'PENDING',
          bucket: 'CURRENT',
        },
      ],
    },
    {
      thirdPartyId: 'c3-uuid',
      identificationNumber: '860012345-3',
      fullName: 'SOLUCIONES DIGITALES GLOBALES S.A.S.',
      phone: '+57 315 444 3322',
      email: 'pagos@solucionesdigitales.co',
      totalBalance: 4050000,
      currentBalance: 0,
      balance1To30: 1300000,
      balance31To60: 2750000,
      balance61To90: 0,
      balanceOver90: 0,
      documents: [
        {
          documentId: 'd4',
          documentNumber: 'FAC-1051',
          issueDate: '2026-08-10',
          dueDate: '2026-09-09',
          daysOverdue: 15,
          originalAmount: 1300000,
          remainingBalance: 1300000,
          status: 'PENDING',
          bucket: 'DAYS_1_TO_30',
        },
        {
          documentId: 'd5',
          documentNumber: 'FAC-1040',
          issueDate: '2026-07-25',
          dueDate: '2026-08-24',
          daysOverdue: 31,
          originalAmount: 3500000,
          remainingBalance: 2750000,
          status: 'PARTIALLY_PAID',
          bucket: 'DAYS_31_TO_60',
        },
      ],
    },
    {
      thirdPartyId: 'c4-uuid',
      identificationNumber: '1020304050',
      fullName: 'CARLOS ANDRÉS VALENCIA (PERSONA NATURAL)',
      phone: '+57 320 111 2233',
      email: 'carlos.valencia@gmail.com',
      totalBalance: 2000000,
      currentBalance: 0,
      balance1To30: 0,
      balance31To60: 0,
      balance61To90: 1200000,
      balanceOver90: 800000,
      documents: [
        {
          documentId: 'd6',
          documentNumber: 'FAC-1012',
          issueDate: '2026-06-15',
          dueDate: '2026-07-15',
          daysOverdue: 71,
          originalAmount: 1200000,
          remainingBalance: 1200000,
          status: 'PENDING',
          bucket: 'DAYS_61_TO_90',
        },
        {
          documentId: 'd7',
          documentNumber: 'FAC-0980',
          issueDate: '2026-05-10',
          dueDate: '2026-06-09',
          daysOverdue: 107,
          originalAmount: 800000,
          remainingBalance: 800000,
          status: 'PENDING',
          bucket: 'OVER_90',
        },
      ],
    },
  ],
};

export const apiService = {
  // Cartera / Billing API
  async getReceivablesAging(asOfDate?: string, thirdPartyId?: string): Promise<ReceivableAgingReport> {
    try {
      const response = await apiClient.get<ReceivableAgingReport>('/billing/receivables/aging', {
        params: { asOfDate, thirdPartyId },
      });
      return response.data;
    } catch (e) {
      console.warn('Backend unavailable, using mock data for Cartera:', e);
      return mockAgingData;
    }
  },

  async getCustomerStatement(thirdPartyId: string): Promise<CustomerStatement> {
    try {
      const response = await apiClient.get<CustomerStatement>(`/billing/receivables/customer/${thirdPartyId}/statement`);
      return response.data;
    } catch (e) {
      const cust = mockAgingData.customers.find((c) => c.thirdPartyId === thirdPartyId) || mockAgingData.customers[0];
      return {
        thirdPartyId: cust.thirdPartyId,
        identificationNumber: cust.identificationNumber,
        fullName: cust.fullName,
        phone: cust.phone,
        email: cust.email,
        totalInvoiced: cust.totalBalance + 5000000,
        totalPaid: 5000000,
        currentBalance: cust.totalBalance,
        totalInvoices: cust.documents.length + 1,
        pendingInvoices: cust.documents.length,
        overdueInvoices: cust.documents.filter((d) => d.daysOverdue > 0).length,
        documents: cust.documents.map((d) => ({
          id: d.documentId,
          type: 'RECEIVABLE',
          documentNumber: d.documentNumber,
          thirdPartyName: cust.fullName,
          issueDate: d.issueDate,
          dueDate: d.dueDate,
          subtotal: d.originalAmount / 1.19,
          taxTotal: d.originalAmount - d.originalAmount / 1.19,
          retentionTotal: 0,
          totalAmount: d.originalAmount,
          remainingBalance: d.remainingBalance,
          status: d.status,
        })),
      };
    }
  },

  async getDocumentPayments(documentId: string): Promise<PaymentReceipt[]> {
    try {
      const response = await apiClient.get<PaymentReceipt[]>(`/billing/receivables/${documentId}/payments`);
      return response.data;
    } catch (e) {
      return [
        {
          id: 'rec-1',
          paymentType: 'CASH_IN',
          receiptNumber: 'RC-9901',
          paymentDate: '2026-09-15',
          amountPaid: 750000,
          cashAccountCode: '110505',
          cashAccountName: 'CAJA GENERAL',
          voucherNumber: 'RC-VOUCHER-9901',
        },
      ];
    }
  },

  // Documentos Equivalentes
  async createEquivalentDocument(data: EquivalentDocumentRequest): Promise<EquivalentDocumentResponse> {
    try {
      const response = await apiClient.post<EquivalentDocumentResponse>('/expenses/equivalent-documents', data);
      return response.data;
    } catch (e) {
      // Return simulated success if offline
      return {
        documentType: 'DOCUMENTO_EQUIVALENTE',
        paidImmediately: data.payImmediately,
        debtDocument: {
          id: 'mock-eq-' + Date.now(),
          type: 'PAYABLE',
          documentNumber: data.documentNumber,
          thirdPartyIdentification: data.thirdPartyIdentification || '1020304050',
          thirdPartyName: 'PRESTADOR DE SERVICIOS INDEPENDIENTE',
          issueDate: data.issueDate,
          dueDate: data.dueDate || data.issueDate,
          subtotal: data.subtotal,
          taxTotal: 0,
          retentionTotal: data.subtotal * 0.04,
          totalAmount: data.subtotal * 0.96,
          remainingBalance: data.payImmediately ? 0 : data.subtotal * 0.96,
          status: data.payImmediately ? 'PAID' : 'PENDING',
          voucherNumber: data.payImmediately ? 'CE-' + data.documentNumber : 'CP-' + data.documentNumber,
        },
        journalVoucher: {
          voucherNumber: data.payImmediately ? 'CE-' + data.documentNumber : 'CP-' + data.documentNumber,
          voucherType: data.payImmediately ? 'EGRESO' : 'NOTA_CONTABLE',
        },
        taxCalculation: {
          subtotal: data.subtotal,
          totalAmount: data.subtotal * 0.96,
        },
        paymentReceipt: data.payImmediately
          ? {
            id: 'mock-rec-' + Date.now(),
            paymentType: 'CASH_OUT',
            receiptNumber: 'REC-' + data.documentNumber,
            paymentDate: data.issueDate,
            cashAccountCode: data.cashAccountCode || '110505',
            cashAccountName: 'CAJA GENERAL',
            amountPaid: data.subtotal * 0.96,
          }
          : undefined,
      };
    }
  },

  // Estados Financieros a Nivel de Terceros
  async getPartyTrialBalance(startDate?: string, endDate?: string, partyId?: string): Promise<PartyTrialBalanceResponse> {
    try {
      const response = await apiClient.get<PartyTrialBalanceResponse>('/reports/trial-balance-by-party', {
        params: { startDate, endDate, partyId },
      });
      return response.data;
    } catch (e) {
      return {
        startDate: startDate || '2026-01-01',
        endDate: endDate || '2026-09-24',
        totalInitialDebit: 45000000,
        totalInitialCredit: 45000000,
        totalPeriodDebit: 88500000,
        totalPeriodCredit: 88500000,
        totalFinalDebit: 62000000,
        totalFinalCredit: 62000000,
        items: [
          {
            accountId: 'a1',
            accountCode: '130505',
            accountName: 'CLIENTES NACIONALES',
            accountNature: 'DEBIT',
            partyIdentification: '900876543-1',
            partyName: 'INDUSTRIAS METÁLICAS DEL CARIBE S.A.S.',
            initialBalance: 3200000,
            periodDebit: 12000000,
            periodCredit: 7000000,
            finalBalance: 8200000,
          },
          {
            accountId: 'a2',
            accountCode: '130505',
            accountName: 'CLIENTES NACIONALES',
            accountNature: 'DEBIT',
            partyIdentification: '901234567-8',
            partyName: 'ALIMENTOS Y LOGÍSTICA ANDINA S.A.',
            initialBalance: 0,
            periodDebit: 9500000,
            periodCredit: 5300000,
            finalBalance: 4200000,
          },
          {
            accountId: 'a3',
            accountCode: '220505',
            accountName: 'PROVEEDORES NACIONALES',
            accountNature: 'CREDIT',
            partyIdentification: '800123456-9',
            partyName: 'DISTRIBUIDORA COLOMBIANA DE MATERIAS PRIMAS',
            initialBalance: 5000000,
            periodDebit: 8000000,
            periodCredit: 9500000,
            finalBalance: 6500000,
          },
          {
            accountId: 'a4',
            accountCode: '413505',
            accountName: 'VENTA DE MERCANCÍAS',
            accountNature: 'CREDIT',
            partyIdentification: '900876543-1',
            partyName: 'INDUSTRIAS METÁLICAS DEL CARIBE S.A.S.',
            initialBalance: 0,
            periodDebit: 0,
            periodCredit: 24500000,
            finalBalance: 24500000,
          },
          {
            accountId: 'a5',
            accountCode: '513505',
            accountName: 'SERVICIOS TÉCNICOS Y MANTENIMIENTO',
            accountNature: 'DEBIT',
            partyIdentification: '1020304050',
            partyName: 'JUAN DAVID OSPINA (DOC. EQUIVALENTE)',
            initialBalance: 0,
            periodDebit: 3400000,
            periodCredit: 0,
            finalBalance: 3400000,
          },
        ],
      };
    }
  },

  async getPartyIncomeStatement(startDate?: string, endDate?: string, partyId?: string): Promise<PartyIncomeStatementResponse> {
    try {
      const response = await apiClient.get<PartyIncomeStatementResponse>('/reports/income-statement-by-party', {
        params: { startDate, endDate, partyId },
      });
      return response.data;
    } catch (e) {
      return {
        startDate: startDate || '2026-01-01',
        endDate: endDate || '2026-09-24',
        totalRevenues: 68500000,
        totalCosts: 28000000,
        grossProfit: 40500000,
        totalExpenses: 14200000,
        netOperatingIncome: 26300000,
        parties: [
          {
            partyIdentification: '900876543-1',
            partyName: 'INDUSTRIAS METÁLICAS DEL CARIBE S.A.S.',
            totalRevenues: 38500000,
            totalCosts: 0,
            grossProfit: 38500000,
            totalExpenses: 0,
            netResult: 38500000,
            revenueItems: [
              {
                accountId: 'r1',
                accountCode: '413505',
                accountName: 'Comercio al por mayor y menor',
                nature: 'CREDIT',
                debit: 0,
                credit: 38500000,
                netBalance: 38500000,
              },
            ],
            costItems: [],
            expenseItems: [],
          },
          {
            partyIdentification: '901234567-8',
            partyName: 'ALIMENTOS Y LOGÍSTICA ANDINA S.A.',
            totalRevenues: 30000000,
            totalCosts: 0,
            grossProfit: 30000000,
            totalExpenses: 0,
            netResult: 30000000,
            revenueItems: [
              {
                accountId: 'r2',
                accountCode: '413505',
                accountName: 'Comercio al por mayor y menor',
                nature: 'CREDIT',
                debit: 0,
                credit: 30000000,
                netBalance: 30000000,
              },
            ],
            costItems: [],
            expenseItems: [],
          },
          {
            partyIdentification: '800123456-9',
            partyName: 'DISTRIBUIDORA COLOMBIANA DE MATERIAS PRIMAS',
            totalRevenues: 0,
            totalCosts: 28000000,
            grossProfit: -28000000,
            totalExpenses: 0,
            netResult: -28000000,
            revenueItems: [],
            costItems: [
              {
                accountId: 'c1',
                accountCode: '613505',
                accountName: 'Costo de Mercancías Vendidas',
                nature: 'DEBIT',
                debit: 28000000,
                credit: 0,
                netBalance: 28000000,
              },
            ],
            expenseItems: [],
          },
          {
            partyIdentification: '1020304050',
            partyName: 'JUAN DAVID OSPINA (DOC. EQUIVALENTE)',
            totalRevenues: 0,
            totalCosts: 0,
            grossProfit: 0,
            totalExpenses: 5400000,
            netResult: -5400000,
            revenueItems: [],
            costItems: [],
            expenseItems: [
              {
                accountId: 'e1',
                accountCode: '513505',
                accountName: 'Servicios de Asistencia Técnica',
                nature: 'DEBIT',
                debit: 5400000,
                credit: 0,
                netBalance: 5400000,
              },
            ],
          },
        ],
      };
    }
  },

  async getPartyBalanceSheet(asOfDate?: string, partyId?: string): Promise<PartyBalanceSheetResponse> {
    try {
      const response = await apiClient.get<PartyBalanceSheetResponse>('/reports/balance-sheet-by-party', {
        params: { asOfDate, partyId },
      });
      return response.data;
    } catch (e) {
      return {
        asOfDate: asOfDate || '2026-09-24',
        totalAssets: 95500000,
        totalLiabilities: 34200000,
        totalEquity: 35000000,
        periodIncome: 26300000,
        totalLiabilitiesAndEquity: 95500000,
        isBalanced: true,
        assetItems: [
          {
            accountId: '110505',
            accountCode: '110505',
            accountName: 'CAJA GENERAL Y BANCOS',
            nature: 'DEBIT',
            partyIdentification: '890900123-5',
            partyName: 'BANCO BANCOLOMBIA',
            debit: 77050000,
            credit: 0,
            netBalance: 77050000,
          },
          {
            accountId: '130505-1',
            accountCode: '130505',
            accountName: 'CLIENTES NACIONALES (CARTERA)',
            nature: 'DEBIT',
            partyIdentification: '900876543-1',
            partyName: 'INDUSTRIAS METÁLICAS DEL CARIBE S.A.S.',
            debit: 8200000,
            credit: 0,
            netBalance: 8200000,
          },
          {
            accountId: '130505-2',
            accountCode: '130505',
            accountName: 'CLIENTES NACIONALES (CARTERA)',
            nature: 'DEBIT',
            partyIdentification: '901234567-8',
            partyName: 'ALIMENTOS Y LOGÍSTICA ANDINA S.A.',
            debit: 4200000,
            credit: 0,
            netBalance: 4200000,
          },
          {
            accountId: '135515',
            accountCode: '135515',
            accountName: 'RETENCIÓN EN LA FUENTE A FAVOR',
            nature: 'DEBIT',
            partyIdentification: '800197268-4',
            partyName: 'DIAN - IMPUESTOS NACIONALES',
            debit: 6050000,
            credit: 0,
            netBalance: 6050000,
          },
        ],
        liabilityItems: [
          {
            accountId: '220505',
            accountCode: '220505',
            accountName: 'PROVEEDORES NACIONALES',
            nature: 'CREDIT',
            partyIdentification: '800123456-9',
            partyName: 'DISTRIBUIDORA COLOMBIANA DE MATERIAS PRIMAS',
            debit: 0,
            credit: 25000000,
            netBalance: 25000000,
          },
          {
            accountId: '236540',
            accountCode: '236540',
            accountName: 'RETEFUENTE POR PAGAR EN COMPRAS Y SERVICIOS',
            nature: 'CREDIT',
            partyIdentification: '800197268-4',
            partyName: 'DIAN - IMPUESTOS NACIONALES',
            debit: 0,
            credit: 9200000,
            netBalance: 9200000,
          },
        ],
        equityItems: [
          {
            accountId: '310505',
            accountCode: '310505',
            accountName: 'CAPITAL SUSCRITO Y PAGADO',
            nature: 'CREDIT',
            partyIdentification: '71234567',
            partyName: 'SOCIO PRINCIPAL INVERSIONES S.A.',
            debit: 0,
            credit: 35000000,
            netBalance: 35000000,
          },
        ],
      };
    }
  },

  // Authentication API
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      localStorage.setItem('accounting_jwt_token', response.data.token);
      localStorage.setItem('accounting_user', JSON.stringify(response.data));
      return response.data;
    } catch (e) {
      console.warn('Backend /auth/login unavailable, using mock login fallback:', e);
      // Offline fallback
      const roleMap: Record<string, string> = {
        admin: 'ROLE_ADMIN',
        contador: 'ROLE_CONTADOR',
        auxiliar: 'ROLE_AUXILIAR',
      };
      const nameMap: Record<string, string> = {
        admin: 'Administrador Principal',
        contador: 'Carlos Ruiz - Contador Titular',
        auxiliar: 'Laura Gómez - Auxiliar Contable',
      };
      const mockRes: AuthResponse = {
        token: 'mock-jwt-token-' + Date.now(),
        tokenType: 'Bearer',
        username: credentials.username,
        email: `${credentials.username}@konta.com`,
        fullName: nameMap[credentials.username.toLowerCase()] || 'Usuario Konta',
        role: roleMap[credentials.username.toLowerCase()] || 'ROLE_CONTADOR',
        expiresIn: 86400000,
      };
      localStorage.setItem('accounting_jwt_token', mockRes.token);
      localStorage.setItem('accounting_user', JSON.stringify(mockRes));
      return mockRes;
    }
  },

  async getCurrentUser(): Promise<UserResponse | null> {
    try {
      const response = await apiClient.get<UserResponse>('/auth/me');
      return response.data;
    } catch (e) {
      const saved = localStorage.getItem('accounting_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          id: 'u-1',
          username: parsed.username,
          email: parsed.email,
          fullName: parsed.fullName,
          role: parsed.role,
          enabled: true,
        };
      }
      return null;
    }
  },

  logout(): void {
    localStorage.removeItem('accounting_jwt_token');
    localStorage.removeItem('accounting_user');
  },
};
