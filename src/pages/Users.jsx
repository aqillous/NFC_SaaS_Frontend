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
} from "lucide-react";

import toast from "react-hot-toast";

import * as api from "../lib/api.js";

export default function Users() {
  const [users, setUsers] = useState([]);

  const [entities, setEntities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [resetUser, setResetUser] = useState(null);

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

    if (!needle) {
      return users;
    }

    return users.filter((user) =>
      [
        user.email,
        user.entity_name || "",
        user.is_superuser ? "admin" : "entity",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [users, query]);

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Users
          </h1>

          <p className="mt-1 text-sm text-ink-400">
            Manage platform admins and entity login accounts.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} />
            New user
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-xl">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
        />

        <input
          className="input-field pl-9"
          placeholder="Search email, entity or role…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-subtle md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 font-medium">User</th>

              <th className="px-5 py-3 font-medium">Role</th>

              <th className="px-5 py-3 font-medium">Entity</th>

              <th className="px-5 py-3 font-medium">Status</th>

              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
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
                  onStatus={handleStatus}
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
                </p>

                <p className="mt-1 text-xs text-ink-400">
                  {user.is_superuser
                    ? "Platform admin"
                    : user.entity_name || "Entity account"}
                </p>
              </div>

              <StatusBadge active={user.is_active} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => setResetUser(user)}
                className="btn-secondary"
              >
                <KeyRound size={14} />
                Reset password
              </button>

              <button
                onClick={() => handleStatus(user)}
                className={user.is_active ? "btn-danger" : "btn-secondary"}
              >
                {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}

                {user.is_active ? "Deactivate" : "Activate"}
              </button>
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
    </div>
  );
}

function UserRow({ user, onStatus, onReset }) {
  return (
    <tr className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50">
      <td className="px-5 py-3.5">
        <p className="font-medium text-ink-900">{user.email}</p>

        <p className="mt-0.5 text-xs text-ink-300">
          Created {new Date(user.created_at).toLocaleDateString()}
        </p>
      </td>

      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-ink-600">
          {user.is_superuser ? (
            <ShieldCheck size={15} />
          ) : (
            <UserCheck size={15} />
          )}

          {user.is_superuser ? "Platform admin" : "Entity user"}
        </span>
      </td>

      <td className="px-5 py-3.5 text-ink-500">{user.entity_name || "—"}</td>

      <td className="px-5 py-3.5">
        <StatusBadge active={user.is_active} />
      </td>

      <td className="px-5 py-3.5">
        <div className="flex justify-end gap-1">
          <button
            className="icon-btn"
            title="Reset password"
            onClick={() => onReset(user)}
          >
            <KeyRound size={14} />
          </button>

          <button
            className={
              user.is_active
                ? "icon-btn hover:bg-rust-500/10 hover:text-rust-500"
                : "icon-btn hover:bg-signal-500/10 hover:text-signal-600"
            }
            title={user.is_active ? "Deactivate user" : "Activate user"}
            onClick={() => onStatus(user)}
          >
            {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          </button>
        </div>
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
            <label className="field-label" htmlFor="create-entity">
              Entity
            </label>

            <select
              id="create-entity"
              className="input-field"
              required
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
            >
              <option value="">Select entity…</option>

              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="create-password">
            Password
          </label>

          <div className="flex gap-2">
            <input
              id="create-password"
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
              title="Generate password"
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-950/40"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ink-100 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {title}
          </h2>

          <button onClick={onClose} className="icon-btn">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
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
