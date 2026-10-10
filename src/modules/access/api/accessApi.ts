import { httpClient } from '../../../shared/infrastructure/http/httpClient';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  role: string | null;
  roles: string[];
  permissions: string[];
  enabled: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface RoleItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  system: boolean;
  permissions: string[];
  userCount: number;
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface UserPayload {
  username?: string;
  email: string;
  password?: string;
  fullName?: string;
  phone?: string;
  roles: string[];
  enabled?: boolean;
}

export const accessApi = {
  listUsers: () => httpClient.get<UserAccount[]>('/users').then((r) => r.data),
  createUser: (p: UserPayload) => httpClient.post<UserAccount>('/users', p).then((r) => r.data),
  updateUser: (id: string, p: UserPayload) => httpClient.put<UserAccount>(`/users/${id}`, p).then((r) => r.data),
  assignRoles: (id: string, roles: string[]) => httpClient.put<UserAccount>(`/users/${id}/roles`, { roles }).then((r) => r.data),
  approveUser: async (id: string, roles: string[]) => {
    try {
      return await httpClient.post<UserAccount>(`/users/${id}/approve`, { roles }).then((r) => r.data);
    } catch {
      const updated = await httpClient.put<UserAccount>(`/users/${id}/roles`, { roles }).then((r) => r.data);
      if (!updated.enabled) {
        return await httpClient.patch<UserAccount>(`/users/${id}/status`, null, { params: { enabled: true } }).then((r) => r.data);
      }
      return updated;
    }
  },
  setEnabled: (id: string, enabled: boolean) =>
    httpClient.patch<UserAccount>(`/users/${id}/status`, null, { params: { enabled } }).then((r) => r.data),
  resetPassword: (id: string, newPassword: string) => httpClient.patch(`/users/${id}/password`, { newPassword }),

  listRoles: () => httpClient.get<RoleItem[]>('/roles').then((r) => r.data),
  createRole: (p: { code: string; name: string; description?: string; permissions: string[] }) =>
    httpClient.post<RoleItem>('/roles', p).then((r) => r.data),
  updateRole: (id: string, p: { code: string; name: string; description?: string; permissions: string[] }) =>
    httpClient.put<RoleItem>(`/roles/${id}`, p).then((r) => r.data),

  listPermissions: () => httpClient.get<PermissionItem[]>('/permissions').then((r) => r.data),
};

export const MODULE_LABELS: Record<string, string> = {
  USERS: 'Usuarios',
  ROLES: 'Roles',
  PERMISSIONS: 'Permisos',
  DASHBOARD: 'Dashboard',
  ASSOCIATES: 'Asociados',
  LOANS: 'Préstamos',
  COLLECTIONS: 'Recaudos',
  RECEIVABLES: 'Cuentas por cobrar',
  PAYABLES: 'Cuentas por pagar',
  PUC: 'Plan de cuentas',
  ACCOUNTING: 'Contabilidad',
  REPORTS: 'Reportes',
  SETTINGS: 'Configuración',
};
