import React, { useState } from 'react';
import { Printer, Download } from 'lucide-react';
import type { AssociateReceipt } from '../../types/associate';
import { QuotaReceiptDocument } from './QuotaReceiptModal';
import { Modal } from '../../../../shared/ui/components/Modal';
import { buttonClass } from '../../../../shared/ui/components/PageHeader';
import { usePrintDocument } from '../../../../shared/ui/components/PrintDocumentLayout';
import { documentExportService } from '../../../../services/documentExportService';

interface AssociateVoucherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: AssociateReceipt | null;
}

/**
 * Modal de visualización e impresión de recibo de asociado con diseño oficial y limpio.
 * Utiliza el mismo diseño profesional que el registro de recaudos e imprime exclusivamente el documento.
 */
export const AssociateVoucherPrintModal: React.FC<AssociateVoucherPrintModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { documentId, print } = usePrintDocument();

  if (!isOpen || !receipt) return null;

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await documentExportService.downloadAssociateReceiptPdf(receipt.id, receipt.receiptNumber);
    } catch {
      print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      zIndexClass="z-[70]"
      title={`Recibo ${receipt.receiptNumber}`}
      subtitle={`Comprobante contable ${receipt.voucherNumber ?? ''}`}
      footer={
        <>
          <button type="button" className={buttonClass.secondary} onClick={onClose}>
            Cerrar
          </button>
          <button
            type="button"
            className={buttonClass.secondary}
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            <Download size={15} />
            {downloadingPdf ? 'Descargando…' : 'Descargar PDF'}
          </button>
          <button type="button" className={buttonClass.primary} onClick={print}>
            <Printer size={15} /> Imprimir recibo
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <QuotaReceiptDocument receipt={receipt} documentId={documentId} showPreview />
      </div>
    </Modal>
  );
};
