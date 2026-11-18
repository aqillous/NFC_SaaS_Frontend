import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import * as api from "../lib/api";
import Badge, { subscriptionBadgeProps } from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import PageHeader from "../components/PageHeader.jsx";
import SubscriptionModal from "../components/SubscriptionModal.jsx";
import { useDashboardLanguage } from "../context/DashboardLanguageContext.jsx";
import { DASHBOARD_COPY } from "../lib/dashboardTranslations.js";

export default function Subscriptions() {
  const { language } = useDashboardLanguage();
  const t = DASHBOARD_COPY[language];
  const [searchParams] = useSearchParams();
  const [subscriptions, setSubscriptions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [modalState, setModalState] = useState({ open: false, subscription: null });
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subsRes, entitiesRes] = await Promise.all([
        api.listSubscriptions({}),
        api.listEntities({}),
      ]);
      setSubscriptions(subsRes.data);
      setEntities(entitiesRes.data);
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const entityById = useMemo(() => {
    const map = {};
    for (const entity of entities) map[entity.id] = entity;
    return map;
  }, [entities]);

  const filtered = useMemo(() => {
    if (!statusFilter) return subscriptions;
    if (statusFilter === "VALID") return subscriptions.filter((item) => item.is_currently_valid);
    if (statusFilter === "INVALID") return subscriptions.filter((item) => !item.is_currently_valid);
    if (statusFilter === "EXPIRING_SOON") return subscriptions.filter((item) =>
      item.is_currently_valid &&
      new Date(item.ends_at).getTime() - Date.now() <= 30 * 86400000,
    );
    if (statusFilter === "EXPIRED") return subscriptions.filter((item) =>
      !item.is_currently_valid || item.status === "EXPIRED",
    );
    return subscriptions.filter((item) => item.status === statusFilter);
  }, [subscriptions, statusFilter]);

  const counts = useMemo(() => ({
    all: subscriptions.length,
    active: subscriptions.filter((item) => item.is_currently_valid && new Date(item.ends_at).getTime() - Date.now() > 30 * 86400000).length,
    expiring: subscriptions.filter((item) =>
      item.is_currently_valid && new Date(item.ends_at).getTime() - Date.now() <= 30 * 86400000,
    ).length,
    expired: subscriptions.filter((item) => !item.is_currently_valid || item.status === "EXPIRED").length,
  }), [subscriptions]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await api.deleteSubscription(pendingDelete.id);
      toast.success("Subscription deleted");
      setSubscriptions((current) => current.filter((item) => item.id !== pendingDelete.id));
    } catch {
      toast.error("Failed to delete subscription");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.subscriptions}
        description={t.subscriptionsDescription}
        actions={
          <button
            className="btn-primary sm:w-auto"
            onClick={() => setModalState({ open: true, subscription: null })}
            disabled={entities.length === 0}
          >
            <Plus size={16} />
            {t.newSubscription}
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          aria-label="Filter subscriptions"
          className="input-field w-full sm:hidden"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t.allSubscriptions}</option>
          <option value="VALID">Currently valid</option>
          <option value="INVALID">Not valid</option>
          <option value="ACTIVE">Status: Active</option>
          <option value="EXPIRED">Status: Expired</option>
          <option value="CANCELLED">Status: Cancelled</option>
        </select>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {[
            { id: "", label: language === "az" ? "Hamısı" : "All", count: counts.all },
            { id: "ACTIVE", label: "Active", count: counts.active },
            { id: "EXPIRING_SOON", label: language === "az" ? "Tezliklə bitir" : "Expiring soon", count: counts.expiring },
            { id: "EXPIRED", label: language === "az" ? "Bitmiş" : "Expired", count: counts.expired },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id)}
              className={`min-h-9 rounded-full border px-3 text-xs font-bold transition ${
                statusFilter === chip.id
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-100 bg-white text-ink-500 hover:bg-ink-50"
              }`}
              aria-pressed={statusFilter === chip.id}
            >
              {chip.label} <span className={statusFilter === chip.id ? "text-white/70" : "text-ink-300"}>{chip.count}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-400">
          {loading ? "Loading..." : `${filtered.length} ${language === "az" ? "abunəlik" : "subscriptions"}`}
        </p>
      </div>

      <div className="panel hidden overflow-hidden lg:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Subscriptions and validity periods</caption>
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/70 text-xs uppercase tracking-wide text-ink-400">
              <th className="px-5 py-3.5 font-semibold">Entity</th>
              <th className="px-5 py-3.5 font-semibold">Status</th>
              <th className="px-5 py-3.5 font-semibold">Start date</th>
              <th className="px-5 py-3.5 font-semibold">End date</th>
              <th className="px-5 py-3.5 font-semibold">Days left</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-300">Loading subscriptions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-300">No subscriptions found.</td></tr>
            ) : filtered.map((subscription) => {
              const badge = subscriptionBadgeProps(subscription);
              const entity = entityById[subscription.entity_id];
              const daysLeft = Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / 86400000);
              const isExpired = !subscription.is_currently_valid || subscription.status === "EXPIRED";
              return (
                <tr key={subscription.id} className={`border-b border-ink-100 last:border-0 hover:bg-ink-50/60 ${isExpired ? "border-l-2 border-l-rust-500/50" : ""}`}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink-900">{entity?.name || "Unknown business"}</p>
                    <p className="mt-0.5 text-xs text-ink-300" title={subscription.id}>ID: ****{subscription.id.slice(-6)}</p>
                  </td>
                  <td className="px-5 py-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                  <td className="px-5 py-4 text-ink-500">{formatDate(subscription.starts_at)}</td>
                  <td className="px-5 py-4 text-ink-500">{formatDate(subscription.ends_at)}</td>
                  <td className="px-5 py-4 text-ink-500">{daysLeft >= 0 ? `${daysLeft}d` : `-${Math.abs(daysLeft)}d`}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      {(badge.variant === "expired" || badge.variant === "warning") && (
                        <button
                          className="btn-secondary min-h-9 px-3"
                          onClick={() => {
                            const today = new Date();
                            const end = new Date(today);
                            end.setFullYear(end.getFullYear() + 1);
                            setModalState({
                              open: true,
                              subscription: {
                                ...subscription,
                                starts_at: today.toISOString(),
                                ends_at: end.toISOString(),
                              },
                            });
                          }}
                        >
                          Renew
                        </button>
                      )}
                      <button
                        className="icon-btn"
                        title="Edit subscription"
                        aria-label="Edit subscription"
                        onClick={() => setModalState({ open: true, subscription })}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-btn hover:!bg-rust-500/10 hover:!text-rust-500"
                        title="Delete subscription"
                        aria-label="Delete subscription"
                        onClick={() => setPendingDelete(subscription)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel h-44 animate-pulse bg-ink-50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="panel col-span-full p-10 text-center text-sm text-ink-300">No subscriptions found.</div>
        ) : filtered.map((subscription) => {
          const badge = subscriptionBadgeProps(subscription);
          const entity = entityById[subscription.entity_id];
          const daysLeft = Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / 86400000);
          const isExpired = badge.variant === "expired";
          return (
            <article key={subscription.id} className={`panel p-4 sm:p-5 ${isExpired ? "border-l-2 border-l-rust-500/50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{entity?.name || "Unknown entity"}</p>
                  <p className="mt-1 text-xs text-ink-400">{formatStatus(subscription.status)}</p>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-ink-50 p-3">
                <div>
                  <p className="text-xs text-ink-300">Start date</p>
                  <p className="mt-1 text-sm font-semibold text-ink-700">{formatDate(subscription.starts_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-300">End date</p>
                  <p className="mt-1 text-sm font-semibold text-ink-700">{formatDate(subscription.ends_at)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-ink-300">Days left</p>
                  <p className="mt-1 text-sm font-semibold text-ink-700">{daysLeft >= 0 ? `${daysLeft}d` : `-${Math.abs(daysLeft)}d`}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-secondary" onClick={() => setModalState({ open: true, subscription })}>
                  <Pencil size={14} /> Edit
                </button>
                {(badge.variant === "expired" || badge.variant === "warning") && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const today = new Date();
                      const end = new Date(today);
                      end.setFullYear(end.getFullYear() + 1);
                      setModalState({ open: true, subscription: { ...subscription, starts_at: today.toISOString(), ends_at: end.toISOString() } });
                    }}
                  >
                    <CalendarDays size={14} /> Renew
                  </button>
                )}
                <button className="btn-danger" onClick={() => setPendingDelete(subscription)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <SubscriptionModal
        open={modalState.open}
        entities={entities}
        subscription={modalState.subscription}
        onClose={() => setModalState({ open: false, subscription: null })}
        onSaved={() => {
          setModalState({ open: false, subscription: null });
          load();
        }}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete subscription"
        message="This removes the subscription record. The entity will show as having no subscription until a new one is created."
        confirmLabel="Delete subscription"
        danger
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function formatStatus(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(value) {
  return new Date(value).toLocaleDateString();
}
