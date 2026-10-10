import React, { useEffect, useRef, useState } from 'react';
import { parseDecimalInput, parseMoneyInput } from '../../lib/format';

const INT = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const baseInput =
  'w-full min-w-0 h-10 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 ' +
  'transition-colors';

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** null = campo vacío (distinto de 0). */
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  invalid?: boolean;
}

/**
 * Campo monetario COP: inicia vacío, agrega separadores de miles mientras se digita ($1.250.000)
 * y entrega pesos enteros o null.
 */
export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  placeholder = 'Ingrese el valor',
  invalid,
  className = '',
  ...rest
}) => {
  const [text, setText] = useState<string>(value == null ? '' : INT.format(value));
  const lastEmitted = useRef<number | null | undefined>(value);

  // Sincroniza cuando el valor cambia desde fuera (reset del formulario, autocompletar cuota...)
  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(value == null ? '' : INT.format(value));
      lastEmitted.current = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseMoneyInput(e.target.value);
    setText(parsed == null ? '' : INT.format(parsed));
    lastEmitted.current = parsed;
    onChange(parsed);
  };

  return (
    <div className="relative w-full min-w-0">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={`${baseInput} pl-7 pr-3 text-right tabular-nums ${invalid ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : ''} ${className}`}
      />
    </div>
  );
};

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  /** Permite decimales (coma o punto). */
  decimals?: boolean;
  /** Texto a la derecha, p. ej. "%" o "meses". */
  suffix?: string;
  invalid?: boolean;
}

/** Campo numérico que inicia vacío (no muestra 0 por defecto). */
export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  decimals = false,
  suffix,
  placeholder = 'Ingrese el valor',
  invalid,
  className = '',
  ...rest
}) => {
  const [text, setText] = useState<string>(value == null ? '' : String(value).replace('.', ','));
  const lastEmitted = useRef<number | null | undefined>(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(value == null ? '' : String(value).replace('.', ','));
      lastEmitted.current = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const allowed = decimals ? raw.replace(/[^\d.,]/g, '') : raw.replace(/[^\d]/g, '');
    setText(allowed);
    const parsed = decimals ? parseDecimalInput(allowed) : allowed === '' ? null : Number(allowed);
    lastEmitted.current = parsed;
    onChange(parsed);
  };

  return (
    <div className="relative w-full min-w-0">
      <input
        {...rest}
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        autoComplete="off"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={`${baseInput} px-3 ${suffix ? 'pr-12' : ''} text-right tabular-nums ${invalid ? 'border-red-400' : ''} ${className}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  );
};

/** Etiqueta + control + mensaje de error, con layout que nunca desborda su contenedor. */
export const FormField: React.FC<{
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, hint, error, className = '', children }) => (
  <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
    <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-red-600">{error}</p>
    ) : hint ? (
      <p className="text-xs text-slate-500">{hint}</p>
    ) : null}
  </div>
);

export const inputClass = `${baseInput} px-3`;
export const selectClass = `${baseInput} px-3 pr-8 cursor-pointer`;
