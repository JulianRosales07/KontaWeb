import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, KeyRound, Pencil, Plus, Power, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { accessApi, MODULE_LABELS, type PermissionItem, type RoleItem, type UserAccount } from '../../api/accessApi';
import { useAuth } from '../../../auth/application/hooks/useAuth';
import { apiErrorMessage } from '../../../../shared/infrastructure/http/apiError';
import { formatDateTime, normalizeText } from '../../../../shared/lib/format';
import { Alert, PageContainer, PageHeader, buttonClass } from '../../../../shared/ui/components/PageHeader';
import { ResponsiveTable, type TableColumn } from '../../../../shared/ui/components/ResponsiveTable';
import { SearchFilterBar } from '../../../../shared/ui/components/SearchFilterBar';
import { StatusBadge } from '../../../../shared/ui/components/StatusBadge';
import { ConfirmationModal, Modal } from '../../../../shared/ui/components/Modal';
import { FormField, inputClass, selectClass } from '../../../../shared/ui/components/MoneyInput';
import { roleLabel } from '../../../../shared/ui/components/Sidebar';

export type AccessTab = 'usuarios' | 'roles' | 'permisos';

interface Props {
  tab: AccessTab;
  onTabChange: (tab: AccessTab) => void;
}

const TABS: { id: AccessTab; label: string; permission: string }[] = [
  { id: 'usuarios', label: 'Usuarios', permission: 'USERS_VIEW' },
  { id: 'roles', label: 'Roles', permission: 'ROLES_VIEW' },
  { id: 'permisos', label: 'Permisos', permission: 'PERMISSIONS_VIEW' },
];

export const AccessManagementPage: React.FC<Props> = ({ tab, onTabChange }) => {
  const { hasPermission } = useAuth();
  const visibleTabs = TABS.filter((t) => hasPermission(t.permission));

  return (
    <PageContainer>
      <PageHeader
        title="Gestión de accesos"
        subtitle="Usuarios, roles y permisos. Los cambios aplican de inmediato en el servidor."
        icon={<ShieldCheck size={20} />}
      />
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1" role="tablist">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTabChange(t.id)}
            className={`h-9 shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors cursor-pointer ${
              tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'usuarios' && hasPermission('USERS_VIEW') && <UsersTab />}
      {tab === 'roles' && hasPermission('ROLES_VIEW') && <RolesTab />}
      {tab === 'permisos' && hasPermission('PERMISSIONS_VIEW') && <PermissionsTab />}
    </PageContainer>
  );
};

// =====================================================================================
// USUARIOS
// =====================================================================================

const emptyForm = { username: '', email: '', fullName: '', phone: '', password: '', confirm: '', roles: [] as string[], enabled: true };

const UsersTab: React.FC = () => {
  const { hasPermission, currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [editing, setEditing] = useState<UserAccount | 'new' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserAccount | null>(null);
  const [resetTarget, setResetTarget] = useState<UserAccount | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [approveTarget, setApproveTarget] = useState<UserAccount | null>(null);
  const [approveRoles, setApproveRoles] = useState<string[]>([]);
  const [approveError, setApproveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, r] = await Promise.all([accessApi.listUsers(), hasPermission('ROLES_VIEW') ? accessApi.listRoles() : Promise.resolve([])]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
      setError(apiErrorMessage(e, 'No se pudieron cargar los usuarios.'));
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    void load();
  }, [load]);

  const roleOptions = roles.length > 0 ? roles.map((r) => ({ code: r.code, name: r.name })) : [
    { code: 'SUPER_ADMIN', name: 'Super Administrador' },
    { code: 'ADMINISTRADOR', name: 'Administrador' },
  ];

  const pendingUsers = useMemo(() => users.filter((u) => u.roles.length === 0), [users]);

  const filtered = useMemo(() => {
    const q = normalizeText(search);
    return users.filter((u) => {
      if (statusFilter === 'ACTIVE' && !u.enabled) return false;
      if (statusFilter === 'INACTIVE' && u.enabled) return false;
      if (statusFilter === 'PENDING' && u.roles.length > 0) return false;
      if (roleFilter && !u.roles.includes(roleFilter)) return false;
      if (!q) return true;
      return normalizeText(`${u.fullName ?? ''} ${u.username} ${u.email}`).includes(q);
    });
  }, [users, search, statusFilter, roleFilter]);

  const openNew = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditing('new');
  };

  const openEdit = (u: UserAccount) => {
    setForm({ ...emptyForm, username: u.username, email: u.email, fullName: u.fullName ?? '', phone: u.phone ?? '', roles: [...u.roles], enabled: u.enabled });
    setFormError(null);
    setEditing(u);
  };

  const openApprove = (u: UserAccount) => {
    const defaultRole = roles.find((r) => r.code === 'ADMINISTRADOR')?.code ?? roles[0]?.code ?? 'ADMINISTRADOR';
    setApproveRoles(u.roles.length > 0 ? [...u.roles] : [defaultRole]);
    setApproveError(null);
    setApproveTarget(u);
  };

  const confirmApprove = async () => {
    if (!approveTarget) return;
    if (approveRoles.length === 0) {
      setApproveError('Debes seleccionar al menos un rol para autorizar al usuario.');
      return;
    }
    setSaving(true);
    setApproveError(null);
    try {
      await accessApi.approveUser(approveTarget.id, approveRoles);
      setNotice(`Usuario ${approveTarget.fullName || approveTarget.username} aprobado y activado con éxito.`);
      setApproveTarget(null);
      await load();
    } catch (e) {
      setApproveError(apiErrorMessage(e, 'No se pudo aprobar el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setFormError(null);
    if (!form.email.trim()) return setFormError('El correo es obligatorio.');
    if (editing === 'new') {
      if (form.username.trim().length < 3) return setFormError('El usuario debe tener al menos 3 caracteres.');
      if (form.password.length < 6) return setFormError('La contraseña debe tener mínimo 6 caracteres.');
      if (form.password !== form.confirm) return setFormError('Las contraseñas no coinciden.');
    }
    setSaving(true);
    try {
      if (editing === 'new') {
        await accessApi.createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim() || undefined,
          phone: form.phone.trim() || undefined,
          roles: form.roles,
          enabled: form.enabled,
        });
        setNotice(`Usuario ${form.username} creado.`);
      } else if (editing) {
        const wasPending = editing.roles.length === 0;
        await accessApi.updateUser(editing.id, {
          email: form.email.trim(),
          fullName: form.fullName.trim() || undefined,
          phone: form.phone.trim() || undefined,
          roles: form.roles,
        });
        setNotice(
          wasPending && form.roles.length > 0
            ? `Usuario ${editing.username} aprobado y actualizado.`
            : `Usuario ${editing.username} actualizado.`
        );
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(apiErrorMessage(e, 'No se pudo guardar el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setSaving(true);
    try {
      await accessApi.setEnabled(toggleTarget.id, !toggleTarget.enabled);
      setNotice(`Usuario ${toggleTarget.username} ${toggleTarget.enabled ? 'desactivado' : 'activado'}.`);
      setToggleTarget(null);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
      setToggleTarget(null);
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    if (newPassword.length < 6) {
      setFormError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await accessApi.resetPassword(resetTarget.id, newPassword);
      setNotice(`Contraseña de ${resetTarget.username} restablecida.`);
      setResetTarget(null);
      setNewPassword('');
    } catch (e) {
      setFormError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const actions = (u: UserAccount) => (
    <div className="flex flex-wrap items-center gap-1">
      {hasPermission('USERS_UPDATE') && u.roles.length === 0 && (
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
          onClick={() => openApprove(u)}
          title="Aprobar solicitud de registro y asignar roles"
        >
          <UserCheck size={14} /> Aprobar
        </button>
      )}
      {hasPermission('USERS_UPDATE') && (
        <button type="button" className={buttonClass.ghost} onClick={() => openEdit(u)} title="Editar y asignar roles">
          <Pencil size={14} /> Editar
        </button>
      )}
      {hasPermission('USERS_DISABLE') && u.username !== currentUser?.username && (
        <button type="button" className={buttonClass.ghost} onClick={() => setToggleTarget(u)}>
          <Power size={14} /> {u.enabled ? 'Desactivar' : 'Activar'}
        </button>
      )}
      {hasPermission('USERS_RESET_PASSWORD') && (
        <button
          type="button"
          className={buttonClass.ghost}
          onClick={() => {
            setNewPassword('');
            setFormError(null);
            setResetTarget(u);
          }}
        >
          <KeyRound size={14} /> Contraseña
        </button>
      )}
    </div>
  );

  const columns: TableColumn<UserAccount>[] = [
    {
      key: 'name',
      header: 'Usuario',
      render: (u) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{u.fullName || u.username}</p>
          <p className="truncate text-xs text-slate-500">@{u.username}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    { key: 'email', header: 'Correo', render: (u) => <span className="break-all md:whitespace-nowrap md:break-normal">{u.email}</span> },
    {
      key: 'roles',
      header: 'Roles',
      render: (u) =>
        u.roles.length === 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge label="Pendiente de aprobación" tone="warning" />
            {hasPermission('USERS_UPDATE') && (
              <button
                type="button"
                onClick={() => openApprove(u)}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                title="Aprobar usuario y conceder acceso"
              >
                <UserCheck size={12} /> Aprobar
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-1 md:justify-start">
            {u.roles.map((r) => (
              <StatusBadge key={r} label={roleLabel(r)} tone={r === 'SUPER_ADMIN' ? 'primary' : 'info'} />
            ))}
          </div>
        ),
    },
    { key: 'status', header: 'Estado', render: (u) => <StatusBadge status={u.enabled ? 'ACTIVE' : 'INACTIVE'} /> },
    { key: 'last', header: 'Último acceso', render: (u) => <span className="whitespace-nowrap text-xs">{formatDateTime(u.lastLogin, 'Nunca')}</span> },
    { key: 'actions', header: '', render: actions, hideOnMobile: true, align: 'right' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="error" onClose={() => setError(null)}>{error}</Alert>}
      {notice && <Alert tone="success" onClose={() => setNotice(null)}>{notice}</Alert>}

      {pendingUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">
                {pendingUsers.length === 1 ? '1 usuario pendiente de aprobación' : `${pendingUsers.length} usuarios pendientes de aprobación`}
              </p>
              <p className="text-xs text-amber-700">
                Cuentas registradas esperando asignación de roles para poder ingresar y utilizar la plataforma.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {statusFilter !== 'PENDING' && (
              <button
                type="button"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100/60 transition-colors cursor-pointer"
                onClick={() => setStatusFilter('PENDING')}
              >
                Ver pendientes ({pendingUsers.length})
              </button>
            )}
            {pendingUsers.length === 1 && hasPermission('USERS_UPDATE') && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                onClick={() => openApprove(pendingUsers[0])}
              >
                <UserCheck size={14} /> Aprobar a @{pendingUsers[0].username}
              </button>
            )}
          </div>
        </div>
      )}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Buscar por nombre, usuario o correo…"
        activeFilters={(statusFilter ? 1 : 0) + (roleFilter ? 1 : 0)}
        onClear={() => {
          setStatusFilter('');
          setRoleFilter('');
        }}
        actions={
          hasPermission('USERS_CREATE') && (
            <button type="button" className={buttonClass.primary} onClick={openNew}>
              <UserPlus size={16} /> Nuevo usuario
            </button>
          )
        }
      >
        <FormField label="Estado">
          <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="PENDING">Pendientes de aprobación</option>
          </select>
        </FormField>
        <FormField label="Rol">
          <select className={selectClass} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todos</option>
            {roleOptions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </FormField>
      </SearchFilterBar>

      <ResponsiveTable
        columns={columns}
        rows={filtered}
        rowKey={(u) => u.id}
        loading={loading}
        minWidth={980}
        cardTitle={(u) => (
          <span>
            {u.fullName || u.username} <span className="text-xs font-normal text-slate-500">@{u.username}</span>
          </span>
        )}
        cardActions={actions}
        emptyMessage="No hay usuarios que coincidan con la búsqueda."
      />

      {/* Crear / editar */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        locked={saving}
        title={editing === 'new' ? 'Nuevo usuario' : `Editar ${editing?.username ?? ''}`}
        subtitle="Los roles determinan los permisos efectivos del usuario."
        size="md"
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className={buttonClass.primary} onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {formError && (
            <div className="sm:col-span-2">
              <Alert tone="error">{formError}</Alert>
            </div>
          )}
          {editing !== 'new' && editing?.roles.length === 0 && (
            <div className="sm:col-span-2 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <Clock size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Cuenta pendiente de aprobación</p>
                <p className="text-amber-700">Selecciona al menos un rol abajo para aprobar este usuario y autorizar su acceso al sistema.</p>
              </div>
            </div>
          )}
          {editing === 'new' && (
            <FormField label="Usuario" required htmlFor="u-username">
              <input id="u-username" className={inputClass} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
            </FormField>
          )}
          <FormField label="Correo electrónico" required htmlFor="u-email">
            <input id="u-email" type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FormField>
          <FormField label="Nombre completo" htmlFor="u-name">
            <input id="u-name" className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </FormField>
          <FormField label="Teléfono" htmlFor="u-phone">
            <input id="u-phone" type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          {editing === 'new' && (
            <>
              <FormField label="Contraseña" required htmlFor="u-pass" hint="Mínimo 6 caracteres">
                <input id="u-pass" type="password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
              </FormField>
              <FormField label="Confirmar contraseña" required htmlFor="u-pass2">
                <input id="u-pass2" type="password" className={inputClass} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} autoComplete="new-password" />
              </FormField>
            </>
          )}
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-semibold text-slate-700">Roles asignados</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roleOptions.map((r) => (
                <label key={r.code} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-indigo-600"
                    checked={form.roles.includes(r.code)}
                    onChange={(e) =>
                      setForm({ ...form, roles: e.target.checked ? [...form.roles, r.code] : form.roles.filter((x) => x !== r.code) })
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">{r.name}</span>
                    <span className="block text-xs text-slate-500">{r.code}</span>
                  </span>
                </label>
              ))}
            </div>
            {form.roles.length === 0 && <p className="mt-2 text-xs text-amber-700">Sin roles, el usuario no podrá acceder a ningún módulo.</p>}
          </fieldset>
          <button type="submit" className="hidden" />
        </form>
      </Modal>

      <ConfirmationModal
        open={!!toggleTarget}
        title={toggleTarget?.enabled ? 'Desactivar usuario' : 'Activar usuario'}
        message={
          toggleTarget?.enabled
            ? `¿Desactivar a ${toggleTarget?.fullName || toggleTarget?.username}? Su sesión dejará de funcionar de inmediato.`
            : `¿Activar nuevamente a ${toggleTarget?.fullName || toggleTarget?.username}?`
        }
        tone={toggleTarget?.enabled ? 'danger' : 'primary'}
        confirmLabel={toggleTarget?.enabled ? 'Desactivar' : 'Activar'}
        loading={saving}
        onConfirm={confirmToggle}
        onCancel={() => setToggleTarget(null)}
      />

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        locked={saving}
        title="Restablecer contraseña"
        subtitle={resetTarget ? `Usuario ${resetTarget.username}` : undefined}
        size="sm"
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setResetTarget(null)} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className={buttonClass.primary} onClick={confirmReset} disabled={saving}>
              {saving ? 'Guardando…' : 'Restablecer'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {formError && <Alert tone="error">{formError}</Alert>}
          <FormField label="Nueva contraseña" required htmlFor="reset-pass" hint="Comparta la contraseña con el usuario por un canal seguro.">
            <input id="reset-pass" type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </FormField>
        </div>
      </Modal>

      {/* Modal para aprobar usuario */}
      <Modal
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        locked={saving}
        title="Aprobar acceso de usuario"
        subtitle={approveTarget ? `Autorizar acceso al sistema para ${approveTarget.fullName || approveTarget.username}` : undefined}
        size="md"
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setApproveTarget(null)} disabled={saving}>
              Cancelar
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
              onClick={confirmApprove}
              disabled={saving || approveRoles.length === 0}
            >
              <UserCheck size={16} />
              {saving ? 'Aprobando…' : 'Aprobar y activar acceso'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {approveError && <Alert tone="error">{approveError}</Alert>}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white shadow-xs">
                {(approveTarget?.fullName || approveTarget?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{approveTarget?.fullName || approveTarget?.username}</h4>
                  <StatusBadge label="Pendiente de aprobación" tone="warning" />
                </div>
                <p className="text-xs text-slate-500">@{approveTarget?.username}</p>
                <div className="mt-2.5 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="text-slate-400">Correo: </span>
                    <span className="font-medium text-slate-800">{approveTarget?.email}</span>
                  </p>
                  {approveTarget?.phone && (
                    <p>
                      <span className="text-slate-400">Teléfono: </span>
                      <span className="font-medium text-slate-800">{approveTarget.phone}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Roles a otorgar</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona al menos un rol. Los roles determinarán los módulos y permisos a los que tendrá acceso en Konta.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 mt-1">
              {roleOptions.map((r) => {
                const checked = approveRoles.includes(r.code);
                return (
                  <label
                    key={r.code}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                      checked ? 'border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                      checked={checked}
                      onChange={(e) =>
                        setApproveRoles((prev) =>
                          e.target.checked ? [...prev, r.code] : prev.filter((x) => x !== r.code)
                        )
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{r.name}</span>
                      <span className="block text-xs text-slate-500">{r.code}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {approveRoles.length === 0 && (
              <p className="text-xs font-semibold text-amber-700">Debes seleccionar al menos un rol para activar la cuenta.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

// =====================================================================================
// ROLES
// =====================================================================================

const RolesTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<RoleItem | 'new' | null>(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', permissions: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        accessApi.listRoles(),
        hasPermission('PERMISSIONS_VIEW') ? accessApi.listPermissions() : Promise.resolve([] as PermissionItem[]),
      ]);
      setRoles(r);
      setPermissions(p);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    void load();
  }, [load]);

  const byModule = useMemo(() => {
    const m = new Map<string, PermissionItem[]>();
    permissions.forEach((p) => m.set(p.module, [...(m.get(p.module) ?? []), p]));
    return [...m.entries()];
  }, [permissions]);

  const canManage = hasPermission('ROLES_MANAGE');

  const save = async () => {
    setFormError(null);
    setSaving(true);
    try {
      const payload = { code: form.code.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim() || undefined, permissions: form.permissions };
      if (editing === 'new') await accessApi.createRole(payload);
      else if (editing) await accessApi.updateRole(editing.id, payload);
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(apiErrorMessage(e, 'No se pudo guardar el rol.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      {canManage && (
        <div className="flex justify-end">
          <button
            type="button"
            className={buttonClass.primary}
            onClick={() => {
              setForm({ code: '', name: '', description: '', permissions: [] });
              setFormError(null);
              setEditing('new');
            }}
          >
            <Plus size={16} /> Nuevo rol
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {roles.map((r) => (
            <div key={r.id} className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">{r.name}</p>
                  <p className="text-xs font-mono text-slate-500">{r.code}</p>
                  {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {r.system && <StatusBadge label="Sistema" tone="neutral" />}
                  <span className="text-xs text-slate-500">{r.userCount} usuario(s) activo(s)</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {r.permissions.map((p) => (
                  <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                    {p}
                  </span>
                ))}
              </div>
              {canManage && r.code !== 'SUPER_ADMIN' && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    className={buttonClass.ghost}
                    onClick={() => {
                      setForm({ code: r.code, name: r.name, description: r.description ?? '', permissions: [...r.permissions] });
                      setFormError(null);
                      setEditing(r);
                    }}
                  >
                    <Pencil size={14} /> Editar permisos
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        locked={saving}
        title={editing === 'new' ? 'Nuevo rol' : `Rol ${editing?.name ?? ''}`}
        size="lg"
        footer={
          <>
            <button type="button" className={buttonClass.secondary} onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </button>
            <button type="button" className={buttonClass.primary} onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && <Alert tone="error">{formError}</Alert>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Código" required hint="MAYÚSCULAS_CON_GUION_BAJO">
              <input className={inputClass} value={form.code} disabled={editing !== 'new'} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </FormField>
            <FormField label="Nombre" required>
              <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="Descripción" className="sm:col-span-2">
              <input className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>
          </div>
          {byModule.map(([module, perms]) => (
            <fieldset key={module} className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-600">{MODULE_LABELS[module] ?? module}</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {perms.map((p) => (
                  <label key={p.code} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                      checked={form.permissions.includes(p.code)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          permissions: e.target.checked ? [...form.permissions, p.code] : form.permissions.filter((x) => x !== p.code),
                        })
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-slate-800">{p.name}</span>
                      <span className="block font-mono text-[10px] text-slate-500">{p.code}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Modal>
    </div>
  );
};

// =====================================================================================
// PERMISOS
// =====================================================================================

const PermissionsTab: React.FC = () => {
  const { hasPermission } = useAuth();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([accessApi.listPermissions(), hasPermission('ROLES_VIEW') ? accessApi.listRoles() : Promise.resolve([] as RoleItem[])])
      .then(([p, r]) => {
        setPermissions(p);
        setRoles(r);
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [hasPermission]);

  const rows = permissions.filter((p) => {
    const q = normalizeText(search);
    return !q || normalizeText(`${p.code} ${p.name} ${MODULE_LABELS[p.module] ?? p.module}`).includes(q);
  });

  const columns: TableColumn<PermissionItem>[] = [
    { key: 'module', header: 'Módulo', render: (p) => MODULE_LABELS[p.module] ?? p.module },
    { key: 'code', header: 'Código', render: (p) => <span className="font-mono text-xs">{p.code}</span> },
    { key: 'name', header: 'Descripción', render: (p) => p.name },
    {
      key: 'roles',
      header: 'Roles que lo tienen',
      render: (p) => (
        <div className="flex flex-wrap justify-end gap-1 md:justify-start">
          {roles.filter((r) => r.permissions.includes(p.code)).map((r) => (
            <StatusBadge key={r.code} label={r.name} tone={r.code === 'SUPER_ADMIN' ? 'primary' : 'info'} />
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      <SearchFilterBar search={search} onSearchChange={setSearch} placeholder="Buscar permiso…" />
      <ResponsiveTable columns={columns} rows={rows} rowKey={(p) => p.code} loading={loading} cardTitle={(p) => <span className="font-mono text-xs">{p.code}</span>} />
    </div>
  );
};
