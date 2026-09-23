import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";

import * as api from "../lib/api.js";
import Badge, { subscriptionBadgeProps } from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EntityDetailDrawer from "../components/EntityDetailDrawer.jsx";
import FeedbackDrawer from "../components/FeedbackDrawer.jsx";

export default function Entities() {
  const [entities, setEntities] = useState([]);
  const [subsByEntity, setSubsByEntity] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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

  const filtered = useMemo(() => {
    return entities.filter((entity) => {
      if (typeFilter && entity.type !== typeFilter) {
        return false;
      }

      if (search && !entity.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [entities, search, typeFilter]);

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("NFC URL copied");
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
            Entities
          </h1>

          <p className="mt-1 text-sm text-ink-400">
            Restaurants and hotels using NFC review cards.
          </p>
        </div>

        <Link to="/entities/new" className="btn-primary sm:w-auto">
          <Plus size={16} />
          New entity
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_10rem]">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />

          <input
            className="input-field pl-9"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>

          <option value="RESTAURANT">Restaurant</option>

          <option value="HOTEL">Hotel</option>
        </select>
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-subtle md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-xs uppercase tracking-wide text-ink-300">
              <th className="px-5 py-3 font-medium">Entity</th>

              <th className="px-5 py-3 font-medium">Type</th>

              <th className="px-5 py-3 font-medium">Subscription</th>

              <th className="px-5 py-3 font-medium">Ends</th>

              <th className="px-5 py-3 font-medium">NFC URL</th>

              <th className="px-5 py-3 text-right font-medium">Actions</th>
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
                  No entities found.
                </td>
              </tr>
            ) : (
              filtered.map((entity) => (
                <EntityTableRow
                  key={entity.id}
                  entity={entity}
                  sub={subsByEntity[entity.id]}
                  onCopy={handleCopy}
                  onDelete={setPendingDelete}
                  onDetail={setDetailEntity}
                  onFeedback={setFeedbackEntity}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

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
          filtered.map((entity) => {
            const sub = subsByEntity[entity.id];

            const badge = subscriptionBadgeProps(sub);

            return (
              <div key={entity.id} className="panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => setDetailEntity(entity)}
                    className="min-w-0 text-left"
                  >
                    <p className="truncate font-semibold text-ink-900">
                      {entity.name}
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                      {entity.type === "RESTAURANT" ? (
                        <UtensilsCrossed size={13} />
                      ) : (
                        <BedDouble size={13} />
                      )}

                      {entity.type === "RESTAURANT" ? "Restaurant" : "Hotel"}

                      {!entity.is_active && <span>• inactive</span>}
                    </p>
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

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFeedbackEntity(entity)}
                    className="btn-secondary"
                  >
                    <MessageSquare size={14} />
                    Feedback
                  </button>

                  <button
                    onClick={() => handleCopy(entity.nfc_url)}
                    className="btn-secondary"
                  >
                    <Copy size={14} />
                    Copy NFC
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        entity.nfc_url,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    className="btn-secondary"
                    title="Preview rating page"
                  >
                    <ExternalLink size={14} />
                    Preview
                  </button>

                  <Link
                    to={`/entities/${entity.id}/edit`}
                    className="btn-secondary !w-10 shrink-0 px-0"
                    aria-label="Edit"
                  >
                    <Pencil size={14} />
                  </Link>

                  <button
                    onClick={() => setPendingDelete(entity)}
                    className="btn-secondary !w-10 shrink-0 px-0 !text-rust-500"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
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
  onCopy,
  onDelete,
  onDetail,
  onFeedback,
}) {
  const badge = subscriptionBadgeProps(sub);

  return (
    <tr className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50">
      <td className="px-5 py-3.5">
        <button
          onClick={() => onDetail(entity)}
          className="font-medium text-ink-900 hover:text-signal-600 hover:underline"
        >
          {entity.name}
        </button>

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
        {sub ? new Date(sub.ends_at).toLocaleDateString() : "—"}
      </td>

      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <code className="max-w-[180px] truncate text-xs text-ink-400">
            /r/{entity.slug}
          </code>

          <button
            onClick={() => onCopy(entity.nfc_url)}
            className="icon-btn"
            title="Copy NFC URL"
          >
            <Copy size={14} />
          </button>
        </div>
      </td>

      <td className="px-5 py-3.5">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onFeedback(entity)}
            className="icon-btn"
            title="View feedback"
          >
            <MessageSquare size={14} />
          </button>

          <Link
            to={`/entities/${entity.id}/edit`}
            className="icon-btn"
            title="Edit"
          >
            <Pencil size={14} />
          </Link>

          <button
            onClick={() => onDelete(entity)}
            className="icon-btn hover:!bg-rust-500/10 hover:!text-rust-500"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="border-b border-ink-100 last:border-0">
          <td colSpan={6} className="px-5 py-4">
            <div className="h-4 w-full animate-pulse rounded bg-ink-50" />
          </td>
        </tr>
      ))}
    </>
  );
}
