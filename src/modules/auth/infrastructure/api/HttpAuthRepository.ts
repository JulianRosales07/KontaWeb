import type { AxiosInstance } from 'axios';
import type { AuthRepository, LoginCredentials } from '../../domain/ports/out/AuthRepository';
import type { AuthSession } from '../../domain/models/AuthUser';
import type { AuthResponse } from '../../../../types/accounting';
import { NetworkError } from '../../../../shared/domain/errors/DomainError';
import { parsePersistedUser, toAuthSession } from './sessionMapper';

export class HttpAuthRepository implements AuthRepository {
  private readonly http: AxiosInstance;

  constructor(http: AxiosInstance) {
    this.http = http;
  }

  public async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      const response = await this.http.post<AuthResponse>('/auth/login', credentials);
      const session = toAuthSession(response.data);
      localStorage.setItem('accounting_jwt_token', session.token);
      localStorage.setItem('accounting_user', JSON.stringify(session.user));
      return session;
    } catch (error: any) {
      if (error?.response) {
        const errorMsg =
          error.response.data?.detail ||
          error.response.data?.message ||
          'Usuario o contraseña incorrectos. Verifica que la cuenta exista en el sistema.';
        throw new Error(errorMsg);
      }
      throw new NetworkError('No se pudo conectar con el servidor de autenticación.');
    }
  }

  public logout(): void {
    localStorage.removeItem('accounting_jwt_token');
    localStorage.removeItem('accounting_user');
  }

  public getPersistedSession(): AuthSession | null {
    const token = localStorage.getItem('accounting_jwt_token');
    const userJson = localStorage.getItem('accounting_user');
    if (!token || !userJson) return null;
    try {
      const parsed = JSON.parse(userJson);
      const user = parsePersistedUser(parsed);
      if (!user) return null;
      return { token, expiresIn: parsed.expiresIn || 86400000, user };
    } catch {
      return null;
    }
  }
}
