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
import { formatDate as formatDateISO, relativeDays } from "../lib/formatters.js";
import RowActionsMenu from "../components/RowActionsMenu.jsx";

export default function Subscriptions() {
  const { language } = useDashboardLanguage();
  const t = DASHBOARD_COPY[language];
  const [searchParams] = useSearchParams();
  const [subscriptions, setSubscriptions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [businessQuery, setBusinessQuery] = useState("");
  const [sortKey, setSortKey] = useState("default");
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
    let result = subscriptions;
    if (!statusFilter) result = subscriptions;
    else if (statusFilter === "VALID") result = subscriptions.filter((item) => item.is_currently_valid);
    else if (statusFilter === "INVALID") result = subscriptions.filter((item) => !item.is_currently_valid);
    else if (statusFilter === "EXPIRING_SOON") result = subscriptions.filter((item) =>
      item.is_currently_valid &&
      new Date(item.ends_at).getTime() - Date.now() <= 30 * 86400000,
    );
    else if (statusFilter === "EXPIRED") result = subscriptions.filter((item) =>
      !item.is_currently_valid || item.status === "EXPIRED",
    );
    else result = subscriptions.filter((item) => item.status === statusFilter);
    if (businessQuery.trim()) {
      result = result.filter((item) =>
        (entityById[item.entity_id]?.name || "").toLowerCase().includes(businessQuery.trim().toLowerCase()),
      );
    }
    result = [...result].sort((a, b) => {
      if (sortKey === "business") return (entityById[a.entity_id]?.name || "").localeCompare(entityById[b.entity_id]?.name || "");
      if (sortKey === "end") return new Date(a.ends_at) - new Date(b.ends_at);
      if (sortKey === "days") return new Date(a.ends_at) - new Date(b.ends_at);
      const now = Date.now();
      const aExpired = new Date(a.ends_at).getTime() < now;
      const bExpired = new Date(b.ends_at).getTime() < now;
      if (aExpired !== bExpired) return aExpired ? -1 : 1;
      return new Date(a.ends_at) - new Date(b.ends_at);
    });
    return result;
  }, [subscriptions, statusFilter, businessQuery, sortKey, entityById]);
/*
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
*/

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
        <input
          type="search"
          value={businessQuery}
          onChange={(event) => setBusinessQuery(event.target.value)}
          className="input-field max-w-xs"
          placeholder={language === "az" ? "Biznes adı ilə axtar..." : "Search by business name..."}
          aria-label={language === "az" ? "Biznes adı ilə axtar" : "Search by business name"}
        />
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
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <button type="button" onClick={() => setSortKey("business")} className="inline-flex items-center gap-1">{t.business} ⇅</button>
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.status}</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.startDate}</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <button type="button" onClick={() => setSortKey("end")} className="inline-flex items-center gap-1">{t.endDate} ⇅</button>
              </th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
                <button type="button" onClick={() => setSortKey("days")} className="inline-flex items-center gap-1">{t.daysLeft} ⇅</button>
              </th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-300">Loading subscriptions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-300">No subscriptions found.</td></tr>
            ) : filtered.map((subscription) => {
              const badge = subscriptionBadgeProps(subscription, language);
              const entity = entityById[subscription.entity_id];
              const daysLeft = Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / 86400000);
              const isExpired = !subscription.is_currently_valid || subscription.status === "EXPIRED";
              return (
                <tr key={subscription.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/60">
                  <td className={`px-5 py-4 ${isExpired ? "border-l-2 border-l-rust-500" : ""}`}>
                    <p className="font-semibold text-ink-900">{entity?.name || "—"}</p>
                    <button
                      type="button"
                      className="mt-0.5 text-xs text-ink-300"
                      title={subscription.id}
                      aria-label={`Copy subscription ID ${subscription.id}`}
                      onClick={async () => {
                        await navigator.clipboard.writeText(subscription.id);
                        toast.success(t.copyDone);
                      }}
                    >
                      ID: ****{subscription.id.slice(-6)}
                    </button>
                  </td>
                  <td className="px-5 py-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                  <td className="px-5 py-4 text-ink-500">{formatDateISO(subscription.starts_at, language)}</td>
                  <td className="px-5 py-4 text-ink-500">{formatDateISO(subscription.ends_at, language)}</td>
                  <td className={`px-5 py-4 ${daysLeft < 0 ? "text-rust-500" : daysLeft <= 30 ? "text-amber-700" : "text-ink-500"}`}>{relativeDays(subscription.ends_at, language)}</td>
                  <td className="px-5 py-4">
                    <div className="flex h-10 items-center justify-end gap-2">
                      {(badge.variant === "expired" || badge.variant === "warning") && (
                        <button
                          className="btn-secondary w-20 min-h-9 px-3"
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
                          {t.renew}
                        </button>
                      )}
                      <RowActionsMenu
                        label={language === "az" ? "Abunəlik əməliyyatları" : "Subscription actions"}
                        items={[
                          { label: t.edit, icon: <Pencil size={14} />, onClick: () => setModalState({ open: true, subscription }) },
                          ...(badge.variant === "expired" || badge.variant === "warning" ? [{ label: t.renew, icon: <CalendarDays size={14} />, onClick: () => setModalState({ open: true, subscription: { ...subscription, starts_at: new Date().toISOString(), ends_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() } }) }] : []),
                          { label: t.delete, icon: <Trash2 size={14} />, danger: true, onClick: () => setPendingDelete(subscription) },
                        ]}
                      />
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
          const badge = subscriptionBadgeProps(subscription, language);
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
                  <p className="mt-1 text-sm font-semibold text-ink-700">{formatDateISO(subscription.starts_at, language)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-300">End date</p>
                  <p className="mt-1 text-sm font-semibold text-ink-700">{formatDateISO(subscription.ends_at, language)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-ink-300">Days left</p>
                  <p className={`mt-1 text-sm font-semibold ${daysLeft < 0 ? "text-rust-500" : daysLeft <= 30 ? "text-amber-700" : "text-ink-700"}`}>{relativeDays(subscription.ends_at, language)}</p>
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
        requireText={pendingDelete ? (entityById[pendingDelete.entity_id]?.name || "") : undefined}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function formatStatus(status) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
