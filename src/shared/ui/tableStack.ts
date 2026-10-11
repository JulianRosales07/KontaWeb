/**
 * Tablas apiladas en celular (`<table className="table-stack">`).
 *
 * En pantallas < 768px el CSS de `.table-stack` (index.css) convierte cada fila en una tarjeta
 * y muestra cada celda como "Etiqueta: valor". La etiqueta sale de `data-label`; este módulo la
 * copia automáticamente desde el encabezado de la columna, así ninguna tabla tiene que repetirla
 * a mano. Una celda con `data-label` propio (escrito en el JSX) se respeta.
 */

const AUTO = 'labelAuto';

function headerLabels(table: HTMLTableElement): string[] {
  const rows = table.tHead?.rows;
  if (!rows || rows.length === 0) return [];
  const labels: string[] = [];
  // La última fila del encabezado es la que tiene una celda por columna.
  for (const th of Array.from(rows[rows.length - 1].cells)) {
    const text = (th.getAttribute('aria-label') || th.textContent || '').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < th.colSpan; i++) labels.push(text);
  }
  return labels;
}

function labelTable(table: HTMLTableElement) {
  const labels = headerLabels(table);
  const bodies = [...Array.from(table.tBodies), ...(table.tFoot ? [table.tFoot] : [])];
  for (const section of bodies) {
    for (const row of Array.from(section.rows)) {
      let col = 0;
      for (const cell of Array.from(row.cells)) {
        const own = cell.hasAttribute('data-label') && !cell.dataset[AUTO];
        if (!own) {
          // Las celdas que abarcan varias columnas (totales, estados vacíos) van a lo ancho, sin etiqueta.
          const label = cell.colSpan > 1 ? '' : labels[col] ?? '';
          if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label);
          cell.dataset[AUTO] = '1';
        }
        col += cell.colSpan;
      }
    }
  }
}

let scheduled = false;

function labelAll() {
  scheduled = false;
  document.querySelectorAll<HTMLTableElement>('table.table-stack').forEach(labelTable);
}

/** Observa el DOM y etiqueta todas las `table.table-stack`, también las que React renderice después. */
export function installTableStackLabels() {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(labelAll);
  };
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, characterData: true });
  schedule();
}
