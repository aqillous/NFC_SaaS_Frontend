import { useEffect, useState } from "react";

import {
  X,
  Copy,
  ExternalLink,
  Pencil,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import { Link } from "react-router-dom";

import toast from "react-hot-toast";

import Badge, { subscriptionBadgeProps } from "./Badge.jsx";

import * as api from "../lib/api.js";

export default function EntityDetailDrawer({ entity, subscription, onClose }) {
  const [showCreateLogin, setShowCreateLogin] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");

  const [loginPassword, setLoginPassword] = useState("");

  const [creatingLogin, setCreatingLogin] = useState(false);

  useEffect(() => {
    if (!entity) {
      setShowCreateLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    }
  }, [entity]);

  if (!entity) {
    return null;
  }

  const badge = subscriptionBadgeProps(subscription);

  const copyNfcUrl = () => {
    navigator.clipboard.writeText(entity.nfc_url);

    toast.success("NFC URL copied");
  };

  const preview = () => {
    window.open(entity.nfc_url, "_blank", "noopener,noreferrer");
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

    const array = new Uint32Array(12);

    window.crypto.getRandomValues(array);

    const password = Array.from(array)
      .map((number) => chars[number % chars.length])
      .join("");

    setLoginPassword(password);
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(
      `Email: ${loginEmail}\nPassword: ${loginPassword}`,
    );

    toast.success("Credentials copied");
  };

  const createLogin = async (event) => {
    event.preventDefault();

    if (!loginEmail.trim()) {
      toast.error("Enter an email address");

      return;
    }

    if (loginPassword.length < 8) {
      toast.error("Password must be at least 8 characters");

      return;
    }

    setCreatingLogin(true);

    try {
      await api.createEntityUser(entity.id, {
        email: loginEmail,
        password: loginPassword,
      });

      toast.success(`Login created for ${entity.name}`);

      setShowCreateLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create login");
    } finally {
      setCreatingLogin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink-950/30"
        onClick={onClose}
        aria-label="Close"
      />

      <div className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-panel">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold text-ink-900">
              {entity.name}
            </h2>

            <p className="mt-0.5 text-xs text-ink-400">
              {entity.type === "RESTAURANT" ? "Restaurant" : "Hotel"}
            </p>
          </div>

          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <dl className="space-y-5 text-sm">
            {/* Type */}
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                Type
              </dt>

              <dd className="text-ink-800">
                {entity.type === "RESTAURANT" ? "Restaurant" : "Hotel"}
              </dd>
            </div>

            {/* Status */}
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                Status
              </dt>

              <dd>
                <Badge variant={entity.is_active ? "active" : "cancelled"}>
                  {entity.is_active ? "Active entity" : "Inactive entity"}
                </Badge>
              </dd>
            </div>

            {/* Subscription */}
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                Subscription
              </dt>

              <dd>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </dd>
            </div>

            {/* Subscription period */}
            {subscription && (
              <div>
                <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                  Subscription period
                </dt>

                <dd className="text-ink-800">
                  {new Date(subscription.starts_at).toLocaleDateString()}
                  {" – "}
                  {new Date(subscription.ends_at).toLocaleDateString()}
                </dd>
              </div>
            )}

            {/* Google */}
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                Google Review URL
              </dt>

              <dd>
                <a
                  href={entity.google_review_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-signal-600 hover:underline"
                >
                  <span className="truncate">{entity.google_review_url}</span>

                  <ExternalLink size={12} />
                </a>
              </dd>
            </div>

            {/* NFC */}
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                NFC URL
              </dt>

              <dd>
                <code className="block break-all rounded-xl bg-ink-50 p-3 text-xs text-ink-700">
                  {entity.nfc_url}
                </code>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button onClick={preview} className="btn-secondary">
                    <ExternalLink size={14} />
                    Preview
                  </button>

                  <button onClick={copyNfcUrl} className="btn-secondary">
                    <Copy size={14} />
                    Copy NFC
                  </button>
                </div>
              </dd>
            </div>

            {/* Entity login */}
            <div className="border-t border-ink-100 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <dt className="text-sm font-semibold text-ink-900">
                    Entity login
                  </dt>

                  <dd className="mt-1 text-xs leading-5 text-ink-400">
                    Create a login account that can access this entity's
                    dashboard.
                  </dd>
                </div>

                {!showCreateLogin && (
                  <button
                    onClick={() => setShowCreateLogin(true)}
                    className="btn-primary shrink-0"
                  >
                    <UserPlus size={14} />
                    Create login
                  </button>
                )}
              </div>

              {showCreateLogin && (
                <form
                  onSubmit={createLogin}
                  className="mt-4 rounded-2xl border border-ink-100 bg-ink-50/60 p-4"
                >
                  <div>
                    <label htmlFor="entity-user-email" className="field-label">
                      Email
                    </label>

                    <input
                      id="entity-user-email"
                      type="email"
                      required
                      className="input-field"
                      placeholder="restaurant@example.com"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                    />
                  </div>

                  <div className="mt-4">
                    <label
                      htmlFor="entity-user-password"
                      className="field-label"
                    >
                      Password
                    </label>

                    <div className="flex gap-2">
                      <input
                        id="entity-user-password"
                        type="text"
                        required
                        minLength={8}
                        className="input-field"
                        placeholder="Minimum 8 characters"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
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

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setShowCreateLogin(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={!loginEmail || !loginPassword}
                      onClick={copyCredentials}
                      className="btn-secondary"
                    >
                      <Copy size={14} />
                      Copy credentials
                    </button>

                    <button
                      type="submit"
                      disabled={creatingLogin}
                      className="btn-primary sm:ml-auto"
                    >
                      <UserPlus size={14} />

                      {creatingLogin ? "Creating…" : "Create login"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Created */}
            <div>
              <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-300">
                Created
              </dt>

              <dd className="text-ink-800">
                {new Date(entity.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Footer */}
        <div className="border-t border-ink-100 px-5 py-4">
          <Link
            to={`/entities/${entity.id}/edit`}
            className="btn-primary w-full"
          >
            <Pencil size={15} />
            Edit entity
          </Link>
        </div>
      </div>
    </div>
  );
}
