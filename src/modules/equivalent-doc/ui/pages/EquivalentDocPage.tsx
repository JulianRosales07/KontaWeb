import React from 'react';
import {
  ReceiptText,
  CheckCircle2,
  Printer,
  PlusCircle,
  Banknote,
} from 'lucide-react';
import { EquivalentDocProvider } from '../../di/EquivalentDocContext';
import { useEquivalentDoc } from '../../application/hooks/useEquivalentDoc';
import { CarteraDomainService } from '../../../cartera/domain/services/CarteraDomainService';

const EquivalentDocView: React.FC = () => {
  const {
    formData,
    setFormData,
    retentionRate,
    setRetentionRate,
    loading,
    error,
    lastResult,
    history,
    calculations,
    submitDocument,
  } = useEquivalentDoc();

  const formatCOP = CarteraDomainService.formatCOP;

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Documento Soporte Equivalente / Recibo</h1>
          <p className="module-subtitle">
            Emisión de soporte contable a no obligados a facturar (DIAN Colombia) con opción de causación o egreso directo
          </p>
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

      <div className="grid-2col">
        {/* Form Column */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Datos del Documento y Tercero</h2>
              <p className="card-description">
                Registre los datos del prestador de servicios y conceptos de gasto
              </p>
            </div>
            <ReceiptText size={22} color="#0284c7" />
          </div>

          <form onSubmit={submitDocument}>
            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">N° Consecutivo Documento</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Identificación / NIT Tercero</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: 1020304050"
                  value={formData.thirdPartyIdentification}
                  onChange={(e) =>
                    setFormData({ ...formData, thirdPartyIdentification: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Fecha de Emisión</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Vencimiento</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  disabled={formData.payImmediately}
                />
              </div>
            </div>

            <div className="form-group-row">
              <div className="form-group">
                <label className="form-label">Cuenta P.U.C. de Gasto</label>
                <select
                  className="form-control"
                  value={formData.expenseAccountCode}
                  onChange={(e) => setFormData({ ...formData, expenseAccountCode: e.target.value })}
                >
                  <option value="513505">513505 - Mantenimiento y Reparaciones</option>
                  <option value="511010">511010 - Honorarios Asesoría Técnica</option>
                  <option value="513525">513525 - Servicios de Transporte y Fletes</option>
                  <option value="512010">512010 - Arrendamientos y Alquileres</option>
                  <option value="519595">519595 - Otros Gastos Diversos</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tarifa Retención en la Fuente</label>
                <select
                  className="form-control"
                  value={retentionRate}
                  onChange={(e) => setRetentionRate(parseFloat(e.target.value))}
                >
                  <option value={0}>0% - Sin Retención</option>
                  <option value={0.04}>4% - Retención Servicios Generales</option>
                  <option value={0.06}>6% - Retención Servicios Declarantes</option>
                  <option value={0.1}>10% - Retención Honorarios / Consultoría</option>
                  <option value={0.025}>2.5% - Retención Compras Generales</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subtotal del Servicio / Gasto (COP)</label>
              <div className="input-prefix-wrapper">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="form-control"
                  value={formData.subtotal}
                  onChange={(e) =>
                    setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Concepto / Descripción Detallada</label>
              <textarea
                className="form-control"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalle de los servicios o bienes adquiridos..."
                required
              />
            </div>

            {/* Pay Immediately Switch */}
            <div className="pay-switch-box">
              <div className="switch-wrapper">
                <input
                  type="checkbox"
                  id="paySwitch"
                  checked={formData.payImmediately}
                  onChange={(e) =>
                    setFormData({ ...formData, payImmediately: e.target.checked })
                  }
                />
                <label htmlFor="paySwitch" className="switch-label">
                  <strong>Emitir como Comprobante de Egreso / Recibo Inmediato</strong>
                  <span className="switch-desc">
                    {formData.payImmediately
                      ? 'Se generará egreso de caja/banco y quedará saldado de inmediato (Punto 2).'
                      : 'Se causará como Nota Contable a Cuenta por Pagar (2205/2335).'}
                  </span>
                </label>
              </div>

              {formData.payImmediately && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label className="form-label">Cuenta de Caja o Bancos (Salida de dinero)</label>
                  <select
                    className="form-control"
                    value={formData.cashAccountCode}
                    onChange={(e) =>
                      setFormData({ ...formData, cashAccountCode: e.target.value })
                    }
                  >
                    <option value="110505">110505 - Caja General</option>
                    <option value="111005">111005 - Bancos Nacionales (Transferencia)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Calculations preview bar */}
            <div className="calc-summary-box">
              <div className="calc-row">
                <span>Subtotal Gasto:</span>
                <span>{formatCOP(formData.subtotal)}</span>
              </div>
              <div className="calc-row text-warning">
                <span>(-) Retención en la Fuente ({retentionRate * 100}%):</span>
                <span>-{formatCOP(calculations.retentionAmount)}</span>
              </div>
              <div className="calc-row calc-total">
                <span>Neto a Pagar:</span>
                <span className="text-primary">{formatCOP(calculations.netAmount)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              <PlusCircle size={18} />
              <span>{loading ? 'Generando Comprobante...' : 'Emitir Documento Soporte'}</span>
            </button>
          </form>
        </div>

        {/* Preview / Results Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {lastResult ? (
            <div className="card receipt-card">
              <div
                className="card-header"
                style={{
                  borderBottom: '1px dashed var(--border-color)',
                  paddingBottom: '12px',
                }}
              >
                <div>
                  <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    DOCUMENTO EMITIDO CON ÉXITO
                  </span>
                  <h3 className="card-title">
                    Comprobante #{lastResult.debtDocument.documentNumber}
                  </h3>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} />
                  <span>Imprimir</span>
                </button>
              </div>

              <div className="receipt-body">
                <div className="receipt-meta-grid">
                  <div>
                    <span className="meta-label">Tipo:</span>
                    <span className="meta-val">{lastResult.documentType}</span>
                  </div>
                  <div>
                    <span className="meta-label">Comprobante Contable:</span>
                    <span className="meta-val code-badge">
                      {lastResult.journalVoucher?.voucherNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label">Modalidad:</span>
                    <span className="meta-val">
                      {lastResult.paidImmediately ? (
                        <span className="badge badge-info">Egreso Directo (Pagado)</span>
                      ) : (
                        <span className="badge badge-warning">Causación (Pendiente)</span>
                      )}
                    </span>
                  </div>
                  {lastResult.paymentReceipt && (
                    <div>
                      <span className="meta-label">N° Recibo de Caja:</span>
                      <span className="meta-val code-badge">
                        {lastResult.paymentReceipt.receiptNumber}
                      </span>
                    </div>
                  )}
                </div>

                <div className="asiento-box">
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      marginBottom: '8px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    ESTRUCTURA CONTABLE DE ASIENTOS (PARTIDA DOBLE)
                  </div>
                  <div className="asiento-row">
                    <span>{formData.expenseAccountCode} (Gasto)</span>
                    <span style={{ color: 'var(--color-primary-light)' }}>
                      Débito: {formatCOP(formData.subtotal)}
                    </span>
                  </div>
                  {calculations.retentionAmount > 0 && (
                    <div className="asiento-row">
                      <span>236540 (Retefuente por Pagar)</span>
                      <span style={{ color: 'var(--color-warning)' }}>
                        Crédito: {formatCOP(calculations.retentionAmount)}
                      </span>
                    </div>
                  )}
                  <div className="asiento-row">
                    <span>
                      {formData.payImmediately
                        ? `${formData.cashAccountCode} (Caja/Bancos)`
                        : '220505 (Cuentas por Pagar)'}
                    </span>
                    <span style={{ color: 'var(--color-success)' }}>
                      Crédito: {formatCOP(calculations.netAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card empty-preview-card">
              <Banknote size={48} color="#475569" style={{ margin: '0 auto 16px' }} />
              <h3>Vista Previa del Documento</h3>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  maxWidth: '340px',
                  margin: '0 auto',
                }}
              >
                Diligencie el formulario para generar el soporte equivalente oficial conforme a la
                reglamentación DIAN para costos y deducciones.
              </p>
            </div>
          )}

          {/* History of recent emissions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '0.95rem' }}>
                Últimos Documentos Equivalentes
              </h3>
            </div>
            {history.length === 0 ? (
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '16px',
                }}
              >
                No hay documentos emitidos en esta sesión todavía.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table-stack enterprise-table">
                  <thead>
                    <tr>
                      <th>NÚMERO</th>
                      <th>COMPROBANTE</th>
                      <th>ESTADO</th>
                      <th style={{ textAlign: 'right' }}>VALOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={i}>
                        <td>
                          <span className="code-badge">{h.debtDocument.documentNumber}</span>
                        </td>
                        <td>{h.journalVoucher?.voucherNumber}</td>
                        <td>
                          {h.paidImmediately ? (
                            <span className="badge badge-success">Pagado</span>
                          ) : (
                            <span className="badge badge-warning">Por pagar</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCOP(h.debtDocument.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EquivalentDocPage: React.FC = () => {
  return (
    <EquivalentDocProvider>
      <EquivalentDocView />
    </EquivalentDocProvider>
  );
};

export default EquivalentDocPage;
