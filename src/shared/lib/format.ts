/**
 * Formato de presentación unificado (es-CO / COP).
 * Internamente los valores se manejan como number (pesos enteros) o null cuando el campo está vacío.
 */

const INT_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const DEC_FORMAT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** $1.000.000 · -$120.500 · null/undefined → "—" (o el fallback indicado). */
export function formatCOP(value: number | string | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const rounded = Math.round(n);
  return `${rounded < 0 ? '-' : ''}$${INT_FORMAT.format(Math.abs(rounded))}`;
}

/** Igual que formatCOP pero muestra $0 para vacíos (útil en totales). */
export function formatCOPOrZero(value: number | string | null | undefined): string {
  return formatCOP(value ?? 0, '$0');
}

export function formatNumber(value: number | string | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? DEC_FORMAT.format(n) : fallback;
}

export function formatPercent(value: number | string | null | undefined, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? `${DEC_FORMAT.format(n)} %` : fallback;
}

/** "2026-10-31" → "31/10/2026" sin desfases de zona horaria. */
export function formatDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.toLocaleDateString('es-CO');
}

export function formatDateTime(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? fallback
    : d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

/** Fecha local de hoy en formato ISO (YYYY-MM-DD). */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addMonthsISO(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(y, m - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d, lastDay));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}`;
}

/** Texto del input → número de pesos (solo dígitos). Vacío → null (no es lo mismo que 0). */
export function parseMoneyInput(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  if (digits === '') return null;
  return Number(digits);
}

/** Texto del input → número decimal (acepta coma o punto). Vacío → null. */
export function parseDecimalInput(text: string): number | null {
  const cleaned = text.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Normaliza texto para búsquedas: minúsculas y sin tildes. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
}
