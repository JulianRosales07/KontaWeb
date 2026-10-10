/**
 * Konta ERP AI Copilot Service
 * Connects securely to the Spring Boot Backend API (/api/v1/ai/chat)
 * The Groq Cloud API Key is safely guarded inside the backend server environment.
 */
import { httpClient } from '../shared/infrastructure/http/httpClient';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CopilotResponse {
  text: string;
  workDuration: string;
}

export async function askKontaCopilot(
  conversationHistory: Array<{ sender: 'user' | 'assistant'; text: string }>,
  currentPrompt: string
): Promise<CopilotResponse> {
  const startTime = performance.now();

  try {
    const payload = {
      history: conversationHistory.slice(-6).map((item) => ({
        sender: item.sender,
        text: item.text,
      })),
      prompt: currentPrompt,
    };

    const res = await httpClient.post<CopilotResponse>('/ai/chat', payload);
    if (res.data && res.data.text) {
      return res.data;
    }
  } catch (err) {
    console.warn('[Konta Copilot] Backend AI proxy error, activating smart local fallback:', err);
  }

  const elapsedMs = Math.round(performance.now() - startTime);
  const fallback = generateSmartFallback(currentPrompt);
  return {
    text: fallback,
    workDuration: `Konta Copilot · ${(elapsedMs / 1000).toFixed(1)}s`,
  };
}

function generateSmartFallback(prompt: string): string {
  const q = prompt ? prompt.toLowerCase() : '';

  if (q.includes('prestamo') || q.includes('préstamo') || q.includes('credito') || q.includes('crédito')) {
    return 'En Konta ERP los préstamos a asociados se registran bajo la cuenta PUC **136505 (Cuentas por cobrar - Préstamos a asociados)**. Puedes consultar el plan de amortización con cuota fija y registrar los abonos mensuales discriminando capital e intereses (cuenta **421005**).';
  }

  if (q.includes('cartera') || q.includes('aging') || q.includes('cobrar') || q.includes('mora')) {
    return 'Con el módulo de Cartera de Konta clasificas automáticamente las deudas de cuotas y préstamos en 5 bandas de vencimiento (Al día, 1-30, 31-60, 61-90 y +90 días) con extractos por asociado.';
  }

  if (q.includes('soporte') || q.includes('documento') || q.includes('egreso') || q.includes('dian')) {
    return 'El Documento Soporte Electrónico permite deducir costos de adquisiciones a proveedores no obligados a facturar ante la DIAN, aplicando retención en la fuente y generando egreso o causación en la cuenta 2335.';
  }

  if (q.includes('niif') || q.includes('balance') || q.includes('puc') || q.includes('reporte')) {
    return 'Konta genera Balances de Comprobación discriminados por tercero (Cédula/NIT) bajo NIIF, con control en tiempo real de partida doble (Débitos = Créditos).';
  }

  return 'Konta ERP integra de forma nativa la gestión de cuotas de asociados ($50.000), préstamos (PUC 136505), cartera por bandas de vencimiento y contabilidad NIIF con partida doble.';
}
