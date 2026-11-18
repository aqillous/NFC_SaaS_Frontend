import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Copy,
  Pencil,
  Trash2,
  UtensilsCrossed,
  BedDouble,
  MessageSquare,
  ExternalLink,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  QrCode,
} from "lucide-react";
import toast from "react-hot-toast";

import * as api from "../lib/api.js";
import Badge, { subscriptionBadgeProps } from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EntityDetailDrawer from "../components/EntityDetailDrawer.jsx";
import FeedbackDrawer from "../components/FeedbackDrawer.jsx";
import PageHeader from "../components/PageHeader.jsx";
import RowActionsMenu from "../components/RowActionsMenu.jsx";
import { useDashboardLanguage } from "../context/DashboardLanguageContext.jsx";
import { DASHBOARD_COPY } from "../lib/dashboardTranslations.js";

export default function Entities() {
  const { language } = useDashboardLanguage();
  const t = DASHBOARD_COPY[language];
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [entities, setEntities] = useState([]);
  const [subsByEntity, setSubsByEntity] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [detailEntity, setDetailEntity] = useState(null);
  const [feedbackEntity, setFeedbackEntity] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.listEntities({});

      setEntities(data);

      const { data: subs } = await api.listSubscriptions({});

      const latestByEntity = {};

      for (const sub of subs) {
        const existing = latestByEntity[sub.entity_id];

        if (
          !existing ||
          new Date(sub.created_at) > new Date(existing.created_at)
        ) {
          latestByEntity[sub.entity_id] = sub;
        }
      }

      setSubsByEntity(latestByEntity);
    } catch {
      toast.error("Failed to load entities");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (typeFilter) next.set("type", typeFilter);
    if (statusFilter) next.set("status", statusFilter);
    setSearchParams(next, { replace: true });
  }, [typeFilter, statusFilter, setSearchParams]);

  const filtered = useMemo(() => {
    const result = entities.filter((entity) => {
      if (typeFilter && entity.type !== typeFilter) {
        return false;
      }

      if (search && !entity.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      if (statusFilter) {
        const subscription = subsByEntity[entity.id];
        const expired = subscription && (!subscription.is_currently_valid || subscription.status === "EXPIRED");
        const cancelled = subscription?.status === "CANCELLED";
        const expiring = subscription?.is_currently_valid && subscription.ends_at &&
          (new Date(subscription.ends_at).getTime() - Date.now()) <= 30 * 86400000;
        if (statusFilter === "ACTIVE" && (!subscription || !subscription.is_currently_valid)) return false;
        if (statusFilter === "EXPIRED" && (!expired || cancelled)) return false;
        if (statusFilter === "EXPIRING_SOON" && !expiring) return false;
      }

      return true;
    });
    return [...result].sort((a, b) => {
      let left = a[sort.key];
      let right = b[sort.key];
      if (sort.key === "ends") {
        left = subsByEntity[a.id]?.ends_at || "";
        right = subsByEntity[b.id]?.ends_at || "";
      }
      return String(left || "").localeCompare(String(right || ""), undefined, { numeric: true }) *
        (sort.direction === "asc" ? 1 : -1);
    });
  }, [entities, search, typeFilter, statusFilter, subsByEntity, sort]);

  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t.copyDone);
    } catch {
      toast.error("Could not copy automatically");
    }
  };

  const exportSelected = () => {
    const rows = entities.filter((entity) => selected.includes(entity.id));
    const csv = [
      ["Name", "Type", "Subscription ends", "NFC URL"].join(","),
      ...rows.map((entity) => [
        `"${(entity.name || "").replaceAll('"', '""')}"`,
        entity.type,
        subsByEntity[entity.id]?.ends_at || "",
        entity.nfc_url,
      ].join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "businesses.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    try {
      await api.deleteEntity(pendingDelete.id);

      toast.success(`${pendingDelete.name} deleted`);

      setEntities((prev) =>
        prev.filter((entity) => entity.id !== pendingDelete.id),
      );
    } catch {
      toast.error("Failed to delete entity");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={t.businesses}
        description={t.businessesDescription}
        actions={
          <Link to="/entities/new" className="btn-primary sm:w-auto">
            <Plus size={16} />
            {t.newBusiness}
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_10rem_12rem]">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />

          <input
            className="input-field pl-9"
            type="search"
            aria-label={t.searchBusiness}
            placeholder={t.searchBusiness}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          aria-label={t.allTypes}
          className="input-field"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">{t.allTypes}</option>

          <option value="RESTAURANT">{t.restaurant}</option>

          <option value="HOTEL">{t.hotel}</option>
        </select>
        <select
          aria-label={language === "az" ? "Abunəlik statusuna görə filter" : "Filter by subscription status"}
          className="input-field"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t.allStatus}</option>
          <option value="ACTIVE">{t.active}</option>
          <option value="EXPIRING_SOON">{t.expiringSoon}</option>
          <option value="EXPIRED">{t.expired}</option>
        </select>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="text-ink-400">
          {filtered.length} {language === "az" ? "biznes" : "businesses"}
        </p>
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-center gap-2 rounded-2xl border border-ink-100 bg-white p-2 shadow-panel lg:left-[calc(50%+7.5rem)]">
          <span className="flex-1 px-2 text-sm font-semibold text-ink-700">{selected.length} {t.selected}</span>
          <button type="button" className="btn-secondary !w-auto" onClick={exportSelected}>
            {t.exportCsv}
          </button>
          <button type="button" className="btn-secondary !w-auto" onClick={() => setSelected([])}>
            {t.clear}
          </button>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-subtle md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Entities and subscription status</caption>
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-300">
              <th className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all businesses on this page"
                  checked={paged.length > 0 && paged.every((entity) => selected.includes(entity.id))}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...new Set([...current, ...paged.map((entity) => entity.id)])]
                        : current.filter((id) => !paged.some((entity) => entity.id === id)),
                    )
                  }
                />
              </th>
              <th className="px-5 py-3 font-medium">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort({ key: "name", direction: sort.direction === "asc" ? "desc" : "asc" })}>
                  {t.business} <ArrowUpDown size={12} />
                </button>
              </th>

              <th className="px-5 py-3 font-medium">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort({ key: "type", direction: sort.direction === "asc" ? "desc" : "asc" })}>
                  {t.type} <ArrowUpDown size={12} />
                </button>
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.subscription}</th>

              <th className="px-5 py-3 font-medium">
                <button type="button" className="inline-flex items-center gap-1" onClick={() => setSort({ key: "ends", direction: sort.direction === "asc" ? "desc" : "asc" })}>
                  {t.ends} <ArrowUpDown size={12} />
                </button>
              </th>

              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{t.nfcUrl}</th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-400">{t.actions}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-sm text-ink-300"
                >
                  No entities found.
                </td>
              </tr>
            ) : (
              paged.map((entity) => (
                <EntityTableRow
                  key={entity.id}
                  entity={entity}
                  sub={subsByEntity[entity.id]}
                  selected={selected.includes(entity.id)}
                  onSelected={(checked) =>
                    setSelected((current) =>
                      checked
                        ? [...new Set([...current, entity.id])]
                        : current.filter((id) => id !== entity.id),
                    )
                  }
                  onCopy={handleCopy}
                  onDelete={setPendingDelete}
                  onDetail={(entity) => navigate(`/entities/${entity.id}`)}
                  onFeedback={setFeedbackEntity}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-ink-400">
            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} / {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary px-3"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="btn-secondary px-3"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel h-40 animate-pulse bg-ink-50" />
          ))
        ) : filtered.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-ink-300">
            No entities found.
          </div>
        ) : (
          paged.map((entity) => {
            const sub = subsByEntity[entity.id];

            const badge = subscriptionBadgeProps(sub, language);

            return (
              <div
                key={entity.id}
                className="panel cursor-pointer p-4"
                onClick={() => navigate(`/entities/${entity.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/entities/${entity.id}`);
                    }}
                    className="flex min-w-0 items-center gap-2 text-left"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarPalette(entity.name)}`}>
                      {entity.name?.[0]?.toUpperCase() || "B"}
                    </span>
                    <span>
                      <span className="block truncate font-semibold text-ink-900">{capitalizeName(entity.name)}</span>

                      <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                        {entity.type === "RESTAURANT" ? <UtensilsCrossed size={13} /> : <BedDouble size={13} />}
                        {entity.type === "RESTAURANT" ? t.restaurant : t.hotel}
                        {!entity.is_active && <span>• inactive</span>}
                      </span>
                    </span>
                  </button>

                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-ink-50 p-3 text-xs">
                  <div>
                    <p className="text-ink-300">Subscription ends</p>

                    <p className="mt-1 font-semibold text-ink-700">
                      {sub ? new Date(sub.ends_at).toLocaleDateString() : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-ink-300">NFC slug</p>

                    <p className="mt-1 truncate font-mono text-ink-700">
                      /r/{entity.slug}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => navigate(`/entities/${entity.id}`)}
                    className="btn-secondary w-auto"
                  >
                    <ExternalLink size={14} />
                    View
                  </button>
                  <RowActionsMenu
                    label={`Actions for ${entity.name}`}
                    items={[
                      { label: "Edit", icon: <Pencil size={14} />, onClick: () => navigate(`/entities/${entity.id}/edit`) },
                      { label: "View reviews", icon: <MessageSquare size={14} />, onClick: () => setFeedbackEntity(entity) },
                      { label: "Copy NFC link", icon: <Copy size={14} />, onClick: () => handleCopy(entity.nfc_url) },
                      { label: "Delete", icon: <Trash2 size={14} />, danger: true, onClick: () => setPendingDelete(entity) },
                    ]}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete entity"
        message={`This permanently deletes "${pendingDelete?.name}" and its subscriptions. The NFC card will stop working immediately. This cannot be undone.`}
        confirmLabel="Delete entity"
        danger
        requireText={pendingDelete?.name}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {/* Existing entity drawer */}
      <EntityDetailDrawer
        entity={detailEntity}
        subscription={detailEntity ? subsByEntity[detailEntity.id] : null}
        onClose={() => setDetailEntity(null)}
      />

      {/* New feedback drawer */}
      <FeedbackDrawer
        entity={feedbackEntity}
        onClose={() => setFeedbackEntity(null)}
      />
    </div>
  );
}

function EntityTableRow({
  entity,
  sub,
  selected,
  onSelected,
  onCopy,
  onDelete,
  onDetail,
  onFeedback,
}) {
  const { language } = useDashboardLanguage();
  const badge = subscriptionBadgeProps(sub, language);
  const navigate = useNavigate();

  return (
    <tr
      className="cursor-pointer border-b border-ink-100 last:border-0 hover:bg-ink-50/70"
      onClick={() => onDetail(entity)}
    >
      <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelected(event.target.checked)}
          aria-label={`Select ${entity.name}`}
        />
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarPalette(entity.name)}`}>
            {entity.name?.[0]?.toUpperCase() || "B"}
          </span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDetail(entity);
            }}
            className="font-semibold text-ink-900 hover:text-signal-600 hover:underline"
          >
            {capitalizeName(entity.name)}
          </button>
        </div>

        {!entity.is_active && (
          <span className="ml-2 text-xs text-ink-300">(inactive)</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-ink-500">
          {entity.type === "RESTAURANT" ? (
            <UtensilsCrossed size={14} />
          ) : (
            <BedDouble size={14} />
          )}

          {entity.type === "RESTAURANT" ? "Restaurant" : "Hotel"}
        </span>
      </td>

      <td className="px-5 py-3.5">
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </td>

      <td className="px-5 py-3.5 text-ink-500">
        {sub ? (
          <>
            <span>{new Date(sub.ends_at).toLocaleDateString()}</span>
            <span className="mt-0.5 block text-xs text-ink-300">{relativeDateHint(sub.ends_at)}</span>
          </>
        ) : "—"}
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <code className="max-w-[180px] truncate text-xs text-ink-400">
            /r/{entity.slug}
          </code>

          <button
            onClick={() => onCopy(entity.nfc_url)}
            className="icon-btn"
            title={t.copyNfc}
            aria-label={t.copyNfc}
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="icon-btn"
            title={t.qrTodo}
            aria-label={t.qrTodo}
            onClick={(event) => {
              event.stopPropagation();
              toast.info("TODO: QR download needs client-side QR library");
            }}
          >
            <QrCode size={14} />
          </button>
        </div>
      </td>

      <td className="px-5 py-3.5" onClick={(event) => event.stopPropagation()}>
        <RowActionsMenu
          label={`Actions for ${entity.name}`}
          items={[
            { label: "View", icon: <ExternalLink size={14} />, onClick: () => onDetail(entity) },
            { label: "Edit", icon: <Pencil size={14} />, onClick: () => navigate(`/entities/${entity.id}/edit`) },
            { label: "View reviews", icon: <MessageSquare size={14} />, onClick: () => onFeedback(entity) },
            { label: "Copy NFC link", icon: <Copy size={14} />, onClick: () => onCopy(entity.nfc_url) },
            { label: "Delete", icon: <Trash2 size={14} />, danger: true, onClick: () => onDelete(entity) },
          ]}
        />
      </td>
    </tr>
  );
}

function capitalizeName(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function avatarPalette(value) {
  const palette = [
    "bg-[#E8F1FF] text-[#315C94]",
    "bg-[#FDE8E8] text-[#914141]",
    "bg-[#E7F4EC] text-[#356C4B]",
    "bg-[#F3EAFE] text-[#65468A]",
    "bg-[#FFF1D6] text-[#805A24]",
    "bg-[#E8F4F5] text-[#356A70]",
  ];
  const hash = [...(value || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function relativeDateHint(value) {
  if (!value) return "";
  const diff = new Date(value).getTime() - Date.now();
  const days = Math.round(Math.abs(diff) / 86400000);
  if (diff >= 0) return `${days} gün qalıb`;
  return `${days} gün əvvəl bitib`;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-ink-100 last:border-0">
          <td colSpan={7} className="px-5 py-4">
            <div className="h-4 w-full animate-pulse rounded bg-ink-50" />
          </td>
        </tr>
      ))}
    </>
  );
}
