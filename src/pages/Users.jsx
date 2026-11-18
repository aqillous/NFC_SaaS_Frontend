import { useEffect, useMemo, useState } from "react";

import {
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

import toast from "react-hot-toast";
import { Link } from "react-router-dom";

import * as api from "../lib/api.js";
import PageHeader from "../components/PageHeader.jsx";
import { useDashboardLanguage } from "../context/DashboardLanguageContext.jsx";
import { DASHBOARD_COPY } from "../lib/dashboardTranslations.js";
import RowActionsMenu from "../components/RowActionsMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { formatDate } from "../lib/formatters.js";

export default function Users() {
  const { language } = useDashboardLanguage();
  const t = DASHBOARD_COPY[language];
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);

  const [entities, setEntities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [resetUser, setResetUser] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  const load = async () => {
    setLoading(true);

    try {
      const [usersResponse, entitiesResponse] = await Promise.all([
        api.listUsers(),
        api.listEntities({
          is_active: true,
          limit: 500,
        }),
      ]);

      setUsers(usersResponse.data);

      setEntities(entitiesResponse.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = users.filter((user) => {
      if (roleFilter === "admin" && !user.is_superuser) return false;
      if (roleFilter === "business" && user.is_superuser) return false;
      if (statusFilter === "active" && !user.is_active) return false;
      if (statusFilter === "inactive" && user.is_active) return false;
      if (!needle) return true;
      return [
        user.email,
        user.entity_name || "",
        user.is_superuser ? "platform admin" : "business user",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
    return [...result].sort((a, b) => {
      if (currentUser?.id === a.id) return -1;
      if (currentUser?.id === b.id) return 1;
      if (a.is_superuser !== b.is_superuser) return a.is_superuser ? -1 : 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [users, query, roleFilter, statusFilter, currentUser]);

  const handleStatus = async (user) => {
    try {
      const { data } = await api.updateUserStatus(user.id, !user.is_active);

      setUsers((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );

      toast.success(data.is_active ? "User activated" : "User deactivated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update user");
    }
  };

  const handleReset = async (user, password) => {
    try {
      const { data } = await api.resetUserPassword(user.id, password);

      setUsers((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );

      toast.success("Password reset successfully");

      setResetUser(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password");

      throw error;
    }
  };

  return (
    <div>
      <PageHeader
        title={t.users}
        description={t.usersDescription}
        actions={
          <>
            <button onClick={load} className="btn-secondary" disabled={loading}>
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              {t.refresh}
            </button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={16} />
              {t.newUser}
            </button>
          </>
        }
      />

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_10rem_10rem]">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            className="input-field pl-9"
            type="search"
            aria-label={t.searchUsers}
            placeholder={t.searchUsers}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select className="input-field" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="Role filter">
          <option value="all">{t.allRoles}</option>
          <option value="admin">{t.platformAdmin}</option>
          <option value="business">{t.businessUser}</option>
        </select>
        <select className="input-field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status filter">
          <option value="all">{t.allStatus}</option>
          <option value="active">{t.active}</option>
          <option value="inactive">{t.inactive}</option>
        </select>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-subtle md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Platform users and account status</caption>
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.user}</th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.role}</th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.business}</th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.status}</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.lastLogin}</th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">{t.actions}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-ink-300"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  language={language}
                  t={t}
                  onStatus={setPendingStatus}
                  onReset={setResetUser}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((user) => (
          <div key={user.id} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">
                  {user.email}
                  {currentUser?.id === user.id && (
                    <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] text-white">You</span>
                  )}
                </p>

                <p className="mt-1 text-xs text-ink-400">
                  {user.is_superuser
                    ? "Platform admin"
                    : user.entity_name || "Entity account"}
                </p>
              </div>

              <StatusBadge active={user.is_active} />
            </div>

            <div className="mt-3 flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
              <RowActionsMenu
                label={`Actions for ${user.email}`}
                items={[
                  { label: "Reset password", icon: <KeyRound size={14} />, onClick: () => setResetUser(user) },
                  {
                    label: user.is_active ? "Deactivate" : "Activate",
                    icon: user.is_active ? <UserX size={14} /> : <UserCheck size={14} />,
                    danger: user.is_active,
                    disabled: currentUser?.id === user.id,
                    onClick: () => setPendingStatus(user),
                  },
                ]}
              />
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateUserModal
          entities={entities}
          onClose={() => setShowCreate(false)}
          onCreated={(user) => {
            setUsers((current) => [user, ...current]);

            setShowCreate(false);
          }}
        />
      )}

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSubmit={(password) => handleReset(resetUser, password)}
        />
      )}
      <ConfirmDialog
        open={!!pendingStatus}
        title={pendingStatus?.is_active ? "Deactivate user" : "Activate user"}
        message={
          pendingStatus?.is_active
            ? "This prevents the user from signing in, but does not delete the account."
            : "This restores the user's ability to sign in."
        }
        confirmLabel={pendingStatus?.is_active ? "Deactivate" : "Activate"}
        danger={pendingStatus?.is_active}
        onCancel={() => setPendingStatus(null)}
        onConfirm={async () => {
          const user = pendingStatus;
          setPendingStatus(null);
          await handleStatus(user);
        }}
      />
    </div>
  );
}

function UserRow({ user, currentUser, language, t, onStatus, onReset }) {
  return (
    <tr className={`border-b border-ink-100 last:border-0 hover:bg-ink-50/50 ${currentUser?.id === user.id ? "bg-signal-500/5" : ""}`}>
      <td className="px-5 py-3.5">
        <p className="font-medium text-ink-900">
          {user.email}
          {currentUser?.id === user.id && <span className="ml-2 rounded-full bg-ink-900 px-2 py-0.5 text-[10px] text-white">{t.you}</span>}
        </p>

        <p className="mt-0.5 text-xs text-ink-300">
          Created {new Date(user.created_at).toLocaleDateString()}
        </p>
      </td>

      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          user.is_superuser ? "border border-ink-900 text-ink-900" : "bg-ink-100 text-ink-600"
        }`}>
          {user.is_superuser ? (
            <ShieldCheck size={15} />
          ) : (
            <UserCheck size={15} />
          )}

          {user.is_superuser ? t.platformAdmin : t.businessUser}
        </span>
      </td>

      <td className="px-5 py-3.5">
        {user.entity_id ? (
          <Link to={`/entities/${user.entity_id}`} className="font-medium text-signal-600 hover:underline">
            {user.entity_name || "Business"}
          </Link>
        ) : <span className="text-ink-300">—</span>}
      </td>

      <td className="px-5 py-3.5">
        <StatusBadge active={user.is_active} />
      </td>

      <td className="px-5 py-3.5 text-sm text-ink-400">
        {user.last_login ? formatDate(user.last_login, language) : "—"}
        {/* TODO: /api/users returns no last_login field. Backend field needed: last_login */}
      </td>

      <td className="px-5 py-3.5">
        <RowActionsMenu
          label={`Actions for ${user.email}`}
          items={[
            { label: t.resetPassword || "Reset password", icon: <KeyRound size={14} />, onClick: () => onReset(user) },
            {
              label: user.is_active ? t.deactivate || "Deactivate" : t.activate || "Activate",
              icon: user.is_active ? <UserX size={14} /> : <UserCheck size={14} />,
              danger: user.is_active,
              disabled: currentUser?.id === user.id,
              onClick: () => onStatus(user),
            },
          ]}
        />
      </td>
    </tr>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-signal-500/10 text-signal-600" : "bg-ink-100 text-ink-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function CreateUserModal({ entities, onClose, onCreated }) {
  const [mode, setMode] = useState("entity");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [entityId, setEntityId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [businessQuery, setBusinessQuery] = useState("");

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

    const array = new Uint32Array(12);

    window.crypto.getRandomValues(array);

    const value = Array.from(array)
      .map((number) => chars[number % chars.length])
      .join("");

    setPassword(value);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const { data } = await api.createUser({
        email,
        password,
        entity_id: mode === "entity" ? entityId : null,
        is_superuser: mode === "admin",
      });

      onCreated(data);

      toast.success("User created successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);

    toast.success("Credentials copied");
  };

  return (
    <Modal title="Create user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label">Account type</label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("entity")}
              className={mode === "entity" ? "btn-primary" : "btn-secondary"}
            >
              Entity user
            </button>

            <button
              type="button"
              onClick={() => setMode("admin")}
              className={mode === "admin" ? "btn-primary" : "btn-secondary"}
            >
              Platform admin
            </button>
          </div>
          <div id="password-strength" className="mt-2">
            <div className="grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={`h-1.5 rounded-full ${
                    passwordStrength(password) >= level
                      ? passwordStrength(password) >= 3 ? "bg-signal-500" : "bg-amber-500"
                      : "bg-ink-100"
                  }`}
                />
              ))}
            </div>
            {password && password.length < 8 && (
              <p className="mt-1 text-xs text-rust-500">Password must be at least 8 characters.</p>
            )}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="create-email">
            Email
          </label>

          <input
            id="create-email"
            className="input-field"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode === "entity" && (
          <div>
            <label className="field-label" htmlFor="create-business-search">Business</label>
            <input
              id="create-business-search"
              className="input-field"
              type="search"
              value={businessQuery}
              onChange={(event) => setBusinessQuery(event.target.value)}
              placeholder="Search businesses..."
            />
            <select
              id="create-entity"
              className="input-field mt-2"
              required
              value={entityId}
              onChange={(event) => setEntityId(event.target.value)}
            >
              <option value="">Select business…</option>
              {entities
                .filter((entity) => entity.name.toLowerCase().includes(businessQuery.toLowerCase()))
                .map((entity) => (
                  <option key={entity.id} value={entity.id}>{entity.name}</option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="create-password">
            Password
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="create-password"
                className="input-field pr-11"
                type={showPassword ? "text" : "password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="password-strength"
              />
              <button
                type="button"
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-ink-400"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="button"
              onClick={generatePassword}
              className="btn-secondary shrink-0 px-3"
              title="Generate password"
              aria-label="Generate password"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>

          {password && (
            <button
              type="button"
              onClick={copyCredentials}
              className="btn-secondary"
            >
              <Copy size={14} />
              Copy
            </button>
          )}

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSubmit }) {
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

    const array = new Uint32Array(12);

    window.crypto.getRandomValues(array);

    setPassword(
      Array.from(array)
        .map((number) => chars[number % chars.length])
        .join(""),
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(password);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Reset password" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-ink-50 p-3 text-sm">
          Resetting the password for <b>{user.email}</b> immediately.
        </div>

        <div>
          <label className="field-label">New password</label>

          <div className="flex gap-2">
            <input
              className="input-field"
              type="text"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={generatePassword}
              className="btn-secondary shrink-0 px-3"
              aria-label="Generate password"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Saving…" : "Reset password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-100 bg-white shadow-panel"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {title}
          </h2>

          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

function SkeletonRows() {
  return Array.from({
    length: 5,
  }).map((_, index) => (
    <tr key={index} className="border-b border-ink-100 last:border-0">
      <td colSpan={5} className="px-5 py-4">
        <div className="h-4 w-full animate-pulse rounded bg-ink-50" />
      </td>
    </tr>
  ));
}
