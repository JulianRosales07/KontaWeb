import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { securePayloadService } from '../security/securePayloadService';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  __requestId?: string;
  __skipEncryption?: boolean;
  /** Cuerpo original antes de cifrarlo (para reintentar con otra llave). */
  __originalData?: unknown;
  /** Ya se reintentó tras renovar la llave del canal seguro. */
  __secureRetried?: boolean;
}

export const getBaseUrl = (): string => {
  return (
    localStorage.getItem('accounting_api_url') ||
    (import.meta.env?.VITE_API_URL as string) ||
    'http://localhost:8080/api/v1'
  );
};

export const httpClient: AxiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

function isExcludedPath(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/security/public-key') ||
    url.includes('/export') ||
    url.includes('/print') ||
    url.includes('/upload') ||
    url.includes('/import') ||
    url.endsWith('.pdf') ||
    url.endsWith('.xlsx')
  );
}

httpClient.interceptors.request.use(
  async (config: CustomAxiosRequestConfig) => {
    const currentBase = localStorage.getItem('accounting_api_url');
    if (currentBase && config.baseURL !== currentBase) {
      config.baseURL = currentBase;
    }

    const token = localStorage.getItem('accounting_jwt_token');
    if (token && config.headers) {
      if (typeof (config.headers as any).set === 'function') {
        (config.headers as any).set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Exclude file downloads, public key discovery and non-JSON endpoints
    if (
      config.__skipEncryption ||
      isExcludedPath(config.url) ||
      config.responseType === 'blob' ||
      config.responseType === 'arraybuffer' ||
      config.data instanceof FormData
    ) {
      return config;
    }

    const effectiveBaseUrl = config.baseURL || getBaseUrl();
    const method = config.method?.toLowerCase();

    try {
      if ((method === 'post' || method === 'put' || method === 'patch') && config.data) {
        config.__originalData = config.data;
        const { envelope, requestId } = await securePayloadService.protectRequest(
          effectiveBaseUrl,
          config.data
        );
        config.data = envelope;
        config.__requestId = requestId;
      } else if (method === 'get' || method === 'delete') {
        const { headers, requestId } = await securePayloadService.generateSecureChannelHeaders(
          effectiveBaseUrl
        );
        if (config.headers) {
          for (const [key, value] of Object.entries(headers)) {
            if (typeof (config.headers as any).set === 'function') {
              (config.headers as any).set(key, value);
            } else {
              config.headers[key] = value;
            }
          }
        }
        config.__requestId = requestId;
      }
    } catch (err) {
      console.warn('[CanalSeguro] No se pudo proteger la petición:', err);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  async (response) => {
    const config = response.config as CustomAxiosRequestConfig;
    const data = response.data;

    if (data && typeof data === 'object' && 'data' in data && 'nonce' in data) {
      try {
        const decrypted = await securePayloadService.processResponse(data, config?.__requestId);
        response.data = decrypted;
      } catch {
        // Return generic message without exposing cryptographic internals
        throw new Error('No fue posible procesar la información protegida.');
      }
    }

    return response;
  },
  async (error) => {
    // El servidor rechazó el canal cifrado (p. ej. se reinició con otra llave): renovar la llave y reintentar una vez
    const failedConfig = error?.config as CustomAxiosRequestConfig | undefined;
    if (
      failedConfig &&
      !failedConfig.__secureRetried &&
      error?.response?.status === 400 &&
      error?.response?.data?.code === 'SECURE_PAYLOAD_INVALID'
    ) {
      try {
        await securePayloadService.resetPublicKey(failedConfig.baseURL || getBaseUrl());
        failedConfig.__secureRetried = true;
        if (failedConfig.__originalData !== undefined) failedConfig.data = failedConfig.__originalData;
        return httpClient.request(failedConfig);
      } catch {
        // si no se puede renovar, se devuelve el error original
      }
    }
    if (error?.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data;
      if ('data' in data && 'nonce' in data) {
        try {
          const config = error.config as CustomAxiosRequestConfig;
          const decrypted = await securePayloadService.processResponse(data, config?.__requestId);
          error.response.data = decrypted;
        } catch {
          error.message = 'No fue posible procesar la información protegida.';
        }
      }
    }
    return Promise.reject(error);
  }
);
