import type { AuthSession, AuthUser } from '../../domain/models/AuthUser';
import type { AuthResponse } from '../../../../types/accounting';

/** Convierte la respuesta de /auth/* en la sesión del frontend (incluye roles y permisos). */
export function toAuthSession(data: AuthResponse, fallbackPicture?: string): AuthSession {
  const picture = data.picture || data.avatarUrl || fallbackPicture || undefined;
  return {
    token: data.token,
    expiresIn: data.expiresIn || 86400000,
    user: {
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: data.role ?? null,
      roles: data.roles ?? [],
      permissions: data.permissions ?? [],
      outdatedServer: data.permissions === undefined,
      picture,
      avatarUrl: picture,
    },
  };
}

/** Usuario persistido en localStorage (sesiones anteriores pueden no tener roles/permisos). */
export function parsePersistedUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const username =
    typeof u.username === 'string' && u.username.length > 0
      ? u.username
      : typeof u.email === 'string' && u.email.length > 0
      ? u.email
      : null;
  if (!username) return null;
  return {
    username,
    email: typeof u.email === 'string' ? u.email : '',
    fullName: typeof u.fullName === 'string' ? u.fullName : undefined,
    role: typeof u.role === 'string' ? u.role : null,
    roles: Array.isArray(u.roles) ? (u.roles as string[]) : [],
    permissions: Array.isArray(u.permissions) ? (u.permissions as string[]) : [],
    outdatedServer: !Array.isArray(u.permissions),
    picture: typeof u.picture === 'string' ? u.picture : typeof u.avatarUrl === 'string' ? u.avatarUrl : undefined,
    avatarUrl: typeof u.avatarUrl === 'string' ? u.avatarUrl : typeof u.picture === 'string' ? u.picture : undefined,
  };
}
