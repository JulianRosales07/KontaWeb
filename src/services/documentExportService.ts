import { apiClient } from './api';

export const downloadBlobFile = async (
  endpoint: string,
  filename: string,
  params?: Record<string, any>
): Promise<void> => {
  try {
    const response = await apiClient.get(endpoint, {
      params,
      responseType: 'blob',
    });

    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    const blob = new Blob([response.data], { type: contentType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error(`Error al descargar archivo desde ${endpoint}:`, error);
    throw error;
  }
};

export const documentExportService = {
  // 1. Recibos de Abono / Pago (PDF)
  async downloadAssociateReceiptPdf(receiptId: string, receiptNumber?: string): Promise<void> {
    const name = receiptNumber ? `Recibo_${receiptNumber}.pdf` : `Recibo_Asociado_${receiptId}.pdf`;
    return downloadBlobFile(`/associates/receipts/${receiptId}/pdf`, name);
  },

  async downloadTreasuryPaymentPdf(paymentId: string, receiptNumber?: string): Promise<void> {
    const name = receiptNumber ? `Comprobante_Pago_${receiptNumber}.pdf` : `Comprobante_Pago_${paymentId}.pdf`;
    return downloadBlobFile(`/treasury/payments/${paymentId}/pdf`, name);
  },

  // 2. Estados de Cuenta (PDF / Excel)
  async downloadCustomerStatement(
    partyId: string,
    format: 'pdf' | 'excel',
    customerName?: string
  ): Promise<void> {
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const cleanName = (customerName || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Estado_Cuenta_${cleanName}.${ext}`;
    return downloadBlobFile(`/billing/statements/${partyId}/export`, filename, { format });
  },

  async downloadAssociateStatement(
    associateId: string,
    format: 'pdf' | 'excel',
    associateName?: string
  ): Promise<void> {
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    const cleanName = (associateName || 'Asociado').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Extracto_Asociado_${cleanName}.${ext}`;
    return downloadBlobFile(`/associates/${associateId}/statement/export`, filename, { format });
  },

  // 3. Certificado de Retención en la Fuente (Art. 381 E.T.)
  async downloadWithholdingCertificate(
    partyId: string,
    year: number,
    partyName?: string
  ): Promise<void> {
    const cleanName = (partyName || 'Tercero').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Certificado_Retencion_${year}_${cleanName}.pdf`;
    return downloadBlobFile('/tax/withholding-certificate', filename, {
      partyId,
      year,
      format: 'pdf',
    });
  },
};
