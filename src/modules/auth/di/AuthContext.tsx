import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import type { AuthUser, AuthSession } from '../domain/models/AuthUser';
import type { AuthRepository, LoginCredentials } from '../domain/ports/out/AuthRepository';
import { HttpAuthRepository } from '../infrastructure/api/HttpAuthRepository';
import { httpClient } from '../../../shared/infrastructure/http/httpClient';
import { LoginUseCase } from '../application/usecases/LoginUseCase';
import { LogoutUseCase } from '../application/usecases/LogoutUseCase';

export interface AuthContextValue {
  currentUser: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  loginWithSession: (session: AuthSession) => void;
  logout: () => void;
  /** true si el usuario tiene el permiso (solo para mostrar/ocultar UI; el backend valida siempre). */
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissions: string[]) => boolean;
  /** Recarga roles y permisos desde /auth/me. */
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  repositoryOverride?: AuthRepository;
}

const persistUser = (session: AuthSession) => {
  localStorage.setItem('accounting_jwt_token', session.token);
  localStorage.setItem('accounting_user', JSON.stringify({ ...session.user, expiresIn: session.expiresIn }));
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, repositoryOverride }) => {
  const repository = useMemo<AuthRepository>(() => {
    return repositoryOverride || new HttpAuthRepository(httpClient);
  }, [repositoryOverride]);

  const loginUseCase = useMemo(() => new LoginUseCase(repository), [repository]);
  const logoutUseCase = useMemo(() => new LogoutUseCase(repository), [repository]);

  const [session, setSession] = useState<AuthSession | null>(() => repository.getPersistedSession());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthSession> => {
      setIsLoading(true);
      setError(null);
      try {
        const newSession = await loginUseCase.execute(credentials);
        setSession(newSession);
        return newSession;
      } catch (err: any) {
        setError(err?.message || 'Error al iniciar sesión.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loginUseCase]
  );

  const logout = useCallback(() => {
    logoutUseCase.execute();
    setSession(null);
    setError(null);
  }, [logoutUseCase]);

  const loginWithSession = useCallback((newSession: AuthSession) => {
    persistUser(newSession);
    setSession(newSession);
    setError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('accounting_jwt_token');
    if (!token) return;
    try {
      const res = await httpClient.get('/auth/me');
      const me = res.data;
      setSession((prev) => {
        const next: AuthSession = {
          token,
          expiresIn: prev?.expiresIn || 86400000,
          user: {
            username: me.username,
            email: me.email,
            fullName: me.fullName,
            role: me.role ?? null,
            roles: me.roles ?? [],
            permissions: me.permissions ?? [],
            outdatedServer: me.permissions === undefined,
            picture: prev?.user?.picture || me.avatarUrl,
            avatarUrl: prev?.user?.avatarUrl || me.avatarUrl,
          },
        };
        persistUser(next);
        return next;
      });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token vencido, inválido o cuenta desactivada
        logoutUseCase.execute();
        setSession(null);
      }
    }
  }, [logoutUseCase]);

  // Al abrir la app, sincroniza los permisos vigentes (pueden haber cambiado desde el último inicio de sesión)
  useEffect(() => {
    if (session?.token) {
      void refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el backend responde 401 en cualquier llamada, la sesión ya no es válida
  useEffect(() => {
    const id = httpClient.interceptors.response.use(
      (r) => r,
      (err) => {
        const url: string = err?.config?.url || '';
        if (err?.response?.status === 401 && !url.includes('/auth/')) {
          logoutUseCase.execute();
          setSession(null);
        }
        return Promise.reject(err);
      }
    );
    return () => httpClient.interceptors.response.eject(id);
  }, [logoutUseCase]);

  const permissions = session?.user.permissions;
  const hasPermission = useCallback((p: string) => !!permissions?.includes(p), [permissions]);
  const hasAnyPermission = useCallback(
    (...ps: string[]) => ps.some((p) => !!permissions?.includes(p)),
    [permissions]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: session?.user || null,
      token: session?.token || null,
      isAuthenticated: !!session?.token,
      login,
      loginWithSession,
      logout,
      hasPermission,
      hasAnyPermission,
      refreshProfile,
      isLoading,
      error,
    }),
    [session, login, loginWithSession, logout, hasPermission, hasAnyPermission, refreshProfile, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un <AuthProvider>');
  }
  return context;
};
