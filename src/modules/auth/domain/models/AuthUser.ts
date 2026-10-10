export interface AuthUser {
  id?: string;
  username: string;
  email: string;
  fullName?: string;
  /** Rol principal para presentación (SUPER_ADMIN, ADMINISTRADOR...). null = pendiente de aprobación. */
  role: string | null;
  /** Roles asignados en base de datos. */
  roles: string[];
  /** Permisos granulares efectivos (USERS_VIEW, LOANS_CREATE...). La autorización real la valida el backend. */
  permissions: string[];
  /** true si el servidor respondió sin roles/permisos (versión anterior del backend, aún no actualizada). */
  outdatedServer?: boolean;
  picture?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresIn: number;
}
