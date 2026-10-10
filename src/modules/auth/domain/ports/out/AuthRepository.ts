import type { AuthSession } from '../../models/AuthUser';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  logout(): void;
  getPersistedSession(): AuthSession | null;
}
