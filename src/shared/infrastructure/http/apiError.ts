/** Mensaje legible a partir de un error de axios / ProblemDetail del backend. */
export function apiErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  const e = err as { response?: { status?: number; data?: any }; message?: string };
  if (!e?.response) {
    return 'No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.';
  }
  const { status, data } = e.response;
  if (status === 403) return 'No tiene permisos para realizar esta acción.';
  if (status === 401) return 'Su sesión expiró. Inicie sesión nuevamente.';
  if (data?.violations && typeof data.violations === 'object') {
    return Object.values(data.violations as Record<string, string>).join('. ');
  }
  return data?.detail || data?.message || fallback;
}
