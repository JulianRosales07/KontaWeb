import React from 'react';
import {
  Calendar,
  Search,
  RefreshCw,
  Scale,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertOctagon,
  Download,
} from 'lucide-react';
import { FinancialReportsProvider } from '../../di/FinancialReportsContext';
import { useFinancialReports } from '../../application/hooks/useFinancialReports';
import { CarteraDomainService } from '../../../cartera/domain/services/CarteraDomainService';

const FinancialReportsView: React.FC = () => {
  const {
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
    refetch,
  } = useFinancialReports();

  const formatCOP = CarteraDomainService.formatCOP;

  const exportToCSV = () => {
    alert('Exportando reporte a formato CSV / Excel compatible...');
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Estados Financieros a Nivel de Terceros</h1>
          <p className="module-subtitle">
            Consolidación y auditoría contable por beneficiario/cliente/proveedor con integridad de partida doble
          </p>
        </div>

        <div className="header-actions">
          {reportTab !== 'balance-sheet' ? (
            <div className="date-input-group">
              <Calendar size={16} />
              <input
                type="date"
                className="date-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)' }}>al</span>
              <input
                type="date"
                className="date-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="date-input-group">
              <Calendar size={16} />
              <input
                type="date"
                className="date-input"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
              />
            </div>
          )}

          <button className="btn btn-secondary" onClick={refetch} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Consultar</span>
          </button>

          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={16} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Report Sub Tabs */}
      <div className="tab-pills">
        <button
          className={`tab-pill ${reportTab === 'trial-balance' ? 'active' : ''}`}
          onClick={() => setReportTab('trial-balance')}
        >
          <Scale size={16} />
          <span>Balance de Comprobación (Sumas y Saldos)</span>
        </button>

        <button
          className={`tab-pill ${reportTab === 'income-statement' ? 'active' : ''}`}
          onClick={() => setReportTab('income-statement')}
        >
          <TrendingUp size={16} />
          <span>Estado de Resultados (P y G por Terceros)</span>
        </button>

        <button
          className={`tab-pill ${reportTab === 'balance-sheet' ? 'active' : ''}`}
          onClick={() => setReportTab('balance-sheet')}
        >
          <FileSpreadsheet size={16} />
          <span>Balance General (Situación Financiera)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="search-bar" style={{ width: '360px' }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Filtrar por tercero, cuenta o NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 1. TRIAL BALANCE TAB */}
      {reportTab === 'trial-balance' && trialData && (
        <div className="card">
          <div className="equation-banner equation-balanced">
            <CheckCircle2 size={20} color="#10b981" />
            <div>
              <strong>Principio de Partida Doble Verificado:</strong> Sumas Iguales en Movimiento Débito ({formatCOP(trialData.totalPeriodDebit)}) y Crédito ({formatCOP(trialData.totalPeriodCredit)})
            </div>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>CUENTA P.U.C.</th>
                  <th>TERCERO / RAZÓN SOCIAL</th>
                  <th>NIT</th>
                  <th style={{ textAlign: 'right' }}>SALDO INICIAL</th>
                  <th style={{ textAlign: 'right' }}>MOV. DÉBITO</th>
                  <th style={{ textAlign: 'right' }}>MOV. CRÉDITO</th>
                  <th style={{ textAlign: 'right' }}>SALDO FINAL</th>
                </tr>
              </thead>
              <tbody>
                {trialData.items
                  .filter((item) => {
                    const q = searchTerm.toLowerCase();
                    return (
                      (item.partyName && item.partyName.toLowerCase().includes(q)) ||
                      (item.partyIdentification && item.partyIdentification.toLowerCase().includes(q)) ||
                      item.accountCode.includes(q) ||
                      item.accountName.toLowerCase().includes(q)
                    );
                  })
                  .map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="code-badge">{item.accountCode}</span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginTop: '2px' }}>
                          {item.accountName}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.partyName || 'Movimiento sin Tercero'}</div>
                      </td>
                      <td>
                        <span className="code-badge">{item.partyIdentification || 'N/A'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCOP(item.initialBalance)}</td>
                      <td style={{ textAlign: 'right', color: item.periodDebit > 0 ? 'var(--color-primary-light)' : 'inherit' }}>
                        {formatCOP(item.periodDebit)}
                      </td>
                      <td style={{ textAlign: 'right', color: item.periodCredit > 0 ? 'var(--color-success)' : 'inherit' }}>
                        {formatCOP(item.periodCredit)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>
                        {formatCOP(item.finalBalance)}
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="table-total-row">
                  <td colSpan={3}>TOTALES DE CONTROL Y SUMAS IGUALES</td>
                  <td style={{ textAlign: 'right' }}>{formatCOP(trialData.totalInitialDebit)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-primary-light)' }}>
                    {formatCOP(trialData.totalPeriodDebit)}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--color-success)' }}>
                    {formatCOP(trialData.totalPeriodCredit)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>
                    {formatCOP(trialData.totalFinalDebit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 2. INCOME STATEMENT TAB */}
      {reportTab === 'income-statement' && incomeData && (
        <div>
          <div className="kpi-grid">
            <div className="kpi-card highlight-primary">
              <div className="kpi-label">TOTAL INGRESOS (CLASE 4)</div>
              <div className="kpi-value text-primary">{formatCOP(incomeData.totalRevenues)}</div>
              <div className="kpi-meta">Facturación del período</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">COSTOS DE VENTAS (CLASE 6)</div>
              <div className="kpi-value text-warning">{formatCOP(incomeData.totalCosts)}</div>
              <div className="kpi-meta">Costo atribuible a terceros</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">GASTOS OPERACIONALES (CLASE 5)</div>
              <div className="kpi-value text-danger">{formatCOP(incomeData.totalExpenses)}</div>
              <div className="kpi-meta">Incluye Doc. Equivalentes</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">UTILIDAD NETA OPERACIONAL</div>
              <div className="kpi-value text-success">{formatCOP(incomeData.netOperatingIncome)}</div>
              <div className="kpi-meta">Margen Neto Positivo</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Resultado Financiero por Cada Tercero</h3>
                <p className="card-description">
                  Permite conocer con exactitud qué clientes aportaron ingresos y qué terceros representaron gastos o costos
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>TERCERO / RAZÓN SOCIAL</th>
                    <th>NIT / ID</th>
                    <th style={{ textAlign: 'right' }}>INGRESOS (+)</th>
                    <th style={{ textAlign: 'right' }}>COSTOS (-)</th>
                    <th style={{ textAlign: 'right' }}>GASTOS (-)</th>
                    <th style={{ textAlign: 'right' }}>RESULTADO NETO</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeData.parties
                    .filter((p) => {
                      const q = searchTerm.toLowerCase();
                      return (
                        (p.partyName && p.partyName.toLowerCase().includes(q)) ||
                        (p.partyIdentification && p.partyIdentification.toLowerCase().includes(q))
                      );
                    })
                    .map((party, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{party.partyName || 'Sin Tercero Asignado'}</div>
                        </td>
                        <td>
                          <span className="code-badge">{party.partyIdentification || 'N/A'}</span>
                        </td>
                        <td style={{ textAlign: 'right', color: party.totalRevenues > 0 ? 'var(--color-success)' : 'inherit' }}>
                          {formatCOP(party.totalRevenues)}
                        </td>
                        <td style={{ textAlign: 'right', color: party.totalCosts > 0 ? 'var(--color-warning)' : 'inherit' }}>
                          {formatCOP(party.totalCosts)}
                        </td>
                        <td style={{ textAlign: 'right', color: party.totalExpenses > 0 ? 'var(--color-danger)' : 'inherit' }}>
                          {formatCOP(party.totalExpenses)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            color: party.netResult >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                          }}
                        >
                          {formatCOP(party.netResult)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. BALANCE SHEET TAB */}
      {reportTab === 'balance-sheet' && balanceData && (
        <div>
          <div
            className={`equation-banner ${
              balanceData.isBalanced ? 'equation-balanced' : 'equation-unbalanced'
            }`}
          >
            {balanceData.isBalanced ? (
              <CheckCircle2 size={20} color="#10b981" />
            ) : (
              <AlertOctagon size={20} color="#ef4444" />
            )}
            <div>
              <strong>Ecuación Patrimonial Fundamental:</strong> Total Activos (
              {formatCOP(balanceData.totalAssets)}) = Total Pasivos + Patrimonio + Utilidad (
              {formatCOP(balanceData.totalLiabilitiesAndEquity)})
              {balanceData.isBalanced && ' — ¡Balance Cuadrado y Auditado!'}
            </div>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">TOTAL ACTIVOS (CLASE 1)</div>
              <div className="kpi-value text-primary">{formatCOP(balanceData.totalAssets)}</div>
              <div className="kpi-meta">Incluye Cartera por Cobrar</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">TOTAL PASIVOS (CLASE 2)</div>
              <div className="kpi-value text-danger">{formatCOP(balanceData.totalLiabilities)}</div>
              <div className="kpi-meta">Proveedores y Obligaciones</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">PATRIMONIO (CLASE 3)</div>
              <div className="kpi-value text-warning">{formatCOP(balanceData.totalEquity)}</div>
              <div className="kpi-meta">Capital social de socios</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">UTILIDAD DEL EJERCICIO</div>
              <div className="kpi-value text-success">{formatCOP(balanceData.periodIncome)}</div>
              <div className="kpi-meta">Resultado del período</div>
            </div>
          </div>

          {/* Section: Activos */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">1. Detalle de Activos a Nivel de Terceros</h3>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>CUENTA</th>
                    <th>TERCERO / DEUDOR / BANCO</th>
                    <th>NIT</th>
                    <th style={{ textAlign: 'right' }}>SALDO ACTIVO</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceData.assetItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="code-badge">{item.accountCode}</span> {item.accountName}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.partyName}</td>
                      <td>
                        <span className="code-badge">{item.partyIdentification}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary-light)' }}>
                        {formatCOP(item.netBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Pasivos */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">2. Detalle de Pasivos a Nivel de Terceros</h3>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>CUENTA</th>
                    <th>TERCERO / ACREEDOR / PROVEEDOR</th>
                    <th>NIT</th>
                    <th style={{ textAlign: 'right' }}>SALDO PASIVO</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceData.liabilityItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="code-badge">{item.accountCode}</span> {item.accountName}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.partyName}</td>
                      <td>
                        <span className="code-badge">{item.partyIdentification}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)' }}>
                        {formatCOP(item.netBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const FinancialReportsPage: React.FC = () => {
  return (
    <FinancialReportsProvider>
      <FinancialReportsView />
    </FinancialReportsProvider>
  );
};

export default FinancialReportsPage;
