import { useEffect, useMemo, useState } from "react";
import {
  X,
  Star,
  MessageSquare,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";

import * as api from "../lib/api.js";

export default function FeedbackDrawer({ entity, onClose }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entity) {
      setFeedback([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const { data } = await api.listEntityFeedback(entity.id, {
          skip: 0,
          limit: 200,
        });

        if (!cancelled) {
          setFeedback(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error.response?.data?.detail || "Failed to load feedback",
          );

          setFeedback([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [entity]);

  const summary = useMemo(() => {
    const count = feedback.length;

    const totalScore = feedback.reduce(
      (sum, item) => sum + Number(item.overall_score || 0),
      0,
    );

    const googleRedirects = feedback.filter(
      (item) => item.redirected_to_google,
    ).length;

    return {
      count,
      average: count ? totalScore / count : 0,
      googleRedirects,
    };
  }, [feedback]);

  if (!entity) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close feedback"
        className="absolute inset-0 cursor-default bg-ink-950/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-panel">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Customer feedback
            </h2>

            <p className="mt-0.5 truncate text-xs text-ink-400">
              {entity.name}
            </p>
          </div>

          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="border-b border-ink-100 bg-ink-50/60 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard
              label="Feedback"
              value={summary.count}
              icon={MessageSquare}
            />

            <SummaryCard
              label="Average"
              value={summary.average.toFixed(2)}
              icon={Star}
            />

            <SummaryCard
              label="Google"
              value={summary.googleRedirects}
              icon={ExternalLink}
            />
          </div>
        </div>

        {/* Feedback list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-ink-50"
                />
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-50">
                  <MessageSquare size={20} className="text-ink-300" />
                </div>

                <h3 className="mt-4 font-semibold text-ink-800">
                  No feedback yet
                </h3>

                <p className="mt-1 text-sm text-ink-400">
                  Customer submissions will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-ink-100">
              {feedback.map((item) => (
                <FeedbackItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-subtle">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-300">
          {label}
        </span>

        <Icon size={14} className="text-signal-500" />
      </div>

      <p className="mt-1 text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}

function FeedbackItem({ item }) {
  const score = Number(item.overall_score || 0);

  return (
    <article className="p-5">
      <div className="flex items-start gap-3">
        {/* Overall score */}
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            score > 4
              ? "bg-signal-500/10 text-signal-600"
              : score >= 3
                ? "bg-amber-500/10 text-amber-600"
                : "bg-rust-500/10 text-rust-500"
          }`}
        >
          {score.toFixed(1)}
        </div>

        <div className="min-w-0 flex-1">
          {/* Category ratings */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Rating label="Quality" value={item.quality} />

            <Rating label="Service" value={item.service} />

            <Rating label="Taste" value={item.taste} />
          </div>

          {/* Comment */}
          {item.comment && (
            <div className="mt-4 rounded-xl bg-ink-50 p-3.5">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">
                “{item.comment}”
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1 text-ink-400">
              <CalendarDays size={12} />
              {formatDate(item.created_at)}
            </span>

            <span
              className={`rounded-full px-2 py-1 font-semibold ${
                item.redirected_to_google
                  ? "bg-signal-500/10 text-signal-600"
                  : "bg-ink-100 text-ink-500"
              }`}
            >
              {item.redirected_to_google
                ? "Redirected to Google"
                : "Internal feedback"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function Rating({ label, value }) {
  const score = Number(value || 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-500">{label}</span>

        <span className="text-xs font-bold text-ink-800">{score}/5</span>
      </div>

      <div className="mt-1 flex gap-0.5">
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <Star
            key={index}
            size={13}
            className={
              index < score ? "fill-amber-400 text-amber-400" : "text-ink-200"
            }
          />
        ))}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
