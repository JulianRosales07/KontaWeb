import React, { useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { useOrganization } from '../../hooks/useOrganization';
import { formatDateTime } from '../../lib/format';

/**
 * Imprime exclusivamente el documento indicado. El resto de la interfaz (sidebar, navbar, modales, botones)
 * queda oculto por las reglas `body.print-mode` de index.css, así que la impresión NO es una captura de pantalla.
 */
export function printDocument(documentId: string) {
  const target = document.getElementById(documentId);
  if (!target) return;
  const portal = target.closest('.print-portal');
  document.body.classList.add('print-mode');
  portal?.classList.add('print-active');
  const cleanup = () => {
    document.body.classList.remove('print-mode');
    portal?.classList.remove('print-active');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
  // Algunos navegadores móviles no emiten afterprint
  setTimeout(cleanup, 1500);
}

export function usePrintDocument() {
  const id = `print-doc-${useId().replace(/[:«»]/g, '')}`;
  const print = useCallback(() => printDocument(id), [id]);
  return { documentId: id, print };
}

export interface PrintDocumentLayoutProps {
  documentId: string;
  title: string;
  documentNumber?: string;
  /** Pares etiqueta/valor que van bajo el título (asociado, documento, fechas...). */
  meta?: { label: string; value: React.ReactNode }[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Muestra además una vista previa del documento en pantalla (dentro del flujo normal). */
  showPreview?: boolean;
  orientation?: 'portrait' | 'landscape';
}

/** Documento formal imprimible: encabezado con la organización, título, metadatos, contenido y pie. */
export const PrintDocumentLayout: React.FC<PrintDocumentLayoutProps> = ({
  documentId,
  title,
  documentNumber,
  meta = [],
  children,
  footer,
  showPreview = false,
  orientation = 'portrait',
}) => {
  const org = useOrganization();
  const generatedAt = formatDateTime(new Date().toISOString());

  const doc = (withId: boolean) => (
    <div id={withId ? documentId : undefined} className={`print-document print-${orientation}`}>
      <div className="print-doc-header">
        <div className="min-w-0">
          <div className="print-doc-org">{org.name}</div>
          {org.nit && <div className="print-doc-muted">NIT {org.nit}</div>}
        </div>
        <div className="print-doc-title-box">
          <div className="print-doc-title">{title}</div>
          {documentNumber && <div className="print-doc-number">N.º {documentNumber}</div>}
        </div>
      </div>
      {meta.length > 0 && (
        <dl className="print-doc-meta">
          {meta.map((m) => (
            <div key={m.label} className="print-doc-meta-item">
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="print-doc-body">{children}</div>
      {footer && <div className="print-doc-footer">{footer}</div>}
      <div className="print-doc-generated">Generado el {generatedAt}</div>
    </div>
  );

  return (
    <>
      {showPreview && <div className="print-preview overflow-x-auto">{doc(false)}</div>}
      {createPortal(<div className="print-portal">{doc(true)}</div>, document.body)}
    </>
  );
};

/** Bloque de firmas para comprobantes. */
export const SignatureBlock: React.FC<{ labels: string[] }> = ({ labels }) => (
  <div className="print-signatures">
    {labels.map((l) => (
      <div key={l} className="print-signature">
        <div className="print-signature-line" />
        <div>{l}</div>
      </div>
    ))}
  </div>
);
