import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  UtensilsCrossed,
  BedDouble,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarDays,
  Plus,
  Star,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Search,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import * as api from "../lib/api";
import StatTile from "../components/StatTile.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  return user?.is_superuser ? <AdminDashboard /> : <RestaurantDashboard />;
}

/* -------------------------------------------------------------------------- */
/* ADMIN DASHBOARD                                                            */
/* -------------------------------------------------------------------------- */

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);

    api
      .getDashboardStats()
      .then(({ data }) => {
        setStats(data);
      })
      .catch((error) => {
        toast.error(
          error.response?.data?.detail || "Failed to load dashboard stats",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeading
        title="Dashboard"
        description="A quick overview of your review network, customer feedback and NFC activity."
        action={
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {loading ? (
        <SkeletonGrid />
      ) : stats ? (
        <div className="space-y-4">
          {/* Entity statistics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile
              label="Total entities"
              value={stats.total_entities}
              icon={Building2}
              accent="ink"
            />

            <StatTile
              label="Restaurants"
              value={stats.total_restaurants}
              icon={UtensilsCrossed}
              accent="ink"
            />

            <StatTile
              label="Hotels"
              value={stats.total_hotels}
              icon={BedDouble}
              accent="ink"
            />

            <StatTile
              label="Active subscriptions"
              value={stats.active_subscriptions}
              icon={CheckCircle2}
              accent="signal"
            />

            <StatTile
              label="Expired subscriptions"
              value={stats.expired_subscriptions}
              icon={XCircle}
              accent="rust"
            />

            <StatTile
              label="Expiring soon"
              value={stats.expiring_soon}
              icon={AlertTriangle}
              accent="amber"
            />
          </div>

          {/* NFC statistics */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Google opens today"
              value={stats.scans_today}
              icon={ExternalLink}
              accent="signal"
            />

            <StatTile
              label="Google opens this month"
              value={stats.scans_this_month}
              icon={CalendarDays}
              accent="signal"
            />
          </div>

          {/* Feedback overview */}
          <section className="panel p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  Feedback overview
                </h2>

                <p className="text-xs text-ink-400">
                  Customer feedback across all entities.
                </p>
              </div>

              <div className="rounded-full bg-signal-500/10 px-3 py-1 text-xs font-bold text-signal-600">
                {stats.total_feedback} submissions
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <FeedbackMetric
                label="Average rating"
                value={`${Number(stats.average_feedback_score || 0).toFixed(
                  2,
                )} / 5`}
                icon={Star}
              />

              <FeedbackMetric
                label="Google redirects"
                value={stats.google_redirects}
                icon={ExternalLink}
              />

              <FeedbackMetric
                label="Redirect rate"
                value={`${Number(stats.google_redirect_rate || 0).toFixed(1)}%`}
                icon={TrendingUp}
              />

              <FeedbackMetric
                label="This month"
                value={stats.feedback_this_month}
                icon={MessageSquare}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
              <MiniStat
                label="Feedback today"
                value={stats.feedback_today ?? 0}
              />

              <MiniStat
                label="Internal feedback"
                value={stats.internal_feedback ?? 0}
              />
            </div>
          </section>
        </div>
      ) : (
        <EmptyState
          title="Couldn't load dashboard"
          text="Try refreshing the page."
        />
      )}
    </div>
  );
}

function FeedbackMetric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>

        <Icon size={16} className="shrink-0 text-signal-500" />
      </div>

      <p className="mt-2 text-xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* RESTAURANT DASHBOARD                                                       */
/* -------------------------------------------------------------------------- */

function RestaurantDashboard() {
  const [days, setDays] = useState(30);
  const [dashboard, setDashboard] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setFeedbackLoading(true);

    try {
      const [dashRes, feedbackRes] = await Promise.all([
        api.getRestaurantDashboard({ days }),
        api.listRestaurantFeedback({
          skip: 0,
          limit: 200,
        }),
      ]);

      setDashboard(dashRes.data);
      setFeedback(feedbackRes.data);
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to load restaurant dashboard",
      );
    } finally {
      setLoading(false);
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [days]);

  const filteredFeedback = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return feedback;
    }

    return feedback.filter((item) =>
      [
        item.comment,
        item.overall_score,
        item.quality,
        item.service,
        item.taste,
        ...(item.reasons || []).map(feedbackReasonLabel),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [feedback, query]);

  if (loading && !dashboard) {
    return <RestaurantSkeleton />;
  }

  const stats = dashboard?.stats;
  const daily = dashboard?.daily || [];

  const maxSubmissions = Math.max(1, ...daily.map((item) => item.submissions));

  return (
    <div className="space-y-5">
      <PageHeading
        title={dashboard?.entity_name || "Restaurant dashboard"}
        description="See customer sentiment, feedback and Google review performance in one place."
        action={
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Average score"
          value={stats?.average_score?.toFixed(2) || "0.00"}
          suffix="/ 5"
          icon={Star}
        />

        <MetricCard
          label="Feedback received"
          value={stats?.total_submissions ?? 0}
          icon={MessageSquare}
        />

        <MetricCard
          label="Google redirects"
          value={stats?.google_redirects ?? 0}
          icon={TrendingUp}
        />

        <MetricCard
          label="Redirect rate"
          value={`${(stats?.google_redirect_rate ?? 0).toFixed(1)}%`}
          icon={ExternalLink}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        {/* Daily performance */}
        <section className="panel p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Review performance
              </h2>

              <p className="text-xs text-ink-400">
                Customer submissions over time
              </p>
            </div>

            <div className="flex rounded-xl bg-ink-50 p-1">
              {[7, 30, 90].map((value) => (
                <button
                  key={value}
                  onClick={() => setDays(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    days === value
                      ? "bg-white text-ink-900 shadow-sm"
                      : "text-ink-400"
                  }`}
                >
                  {value}d
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex h-48 items-end gap-1.5 overflow-x-auto pb-6">
            {daily.length ? (
              daily.map((item) => (
                <div
                  key={item.date}
                  className="group flex h-full min-w-5 flex-1 flex-col justify-end"
                >
                  <div className="relative flex h-full items-end">
                    <div
                      className="w-full min-w-4 rounded-t-md bg-signal-500/80 transition group-hover:bg-signal-600"
                      style={{
                        height: item.submissions
                          ? `${Math.max(
                              5,
                              (item.submissions / maxSubmissions) * 100,
                            )}%`
                          : "0%",
                      }}
                      title={`${item.submissions} submissions • ${item.google_redirects} Google opens • ${item.average_score.toFixed(2)} avg`}
                    />
                  </div>

                  <span className="mt-2 -rotate-45 origin-top-left whitespace-nowrap text-[9px] text-ink-300">
                    {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex w-full items-center justify-center text-sm text-ink-300">
                No submissions in this period.
              </div>
            )}
          </div>
        </section>

        {/* Overall rating */}
        <section className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Overall rating
              </h2>

              <p className="text-xs text-ink-400">Average customer rating</p>
            </div>

            <div className="rounded-full bg-signal-500/10 px-2.5 py-1 text-xs font-bold text-signal-600">
              5 max
            </div>
          </div>

          <div className="mt-6">
            <ScoreBar label="Average rating" value={stats?.average_score || 0} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
            <MiniStat label="Today" value={stats?.submissions_today ?? 0} />

            <MiniStat
              label="This month"
              value={stats?.submissions_this_month ?? 0}
            />
          </div>
        </section>
      </div>

      {/* Feedback list */}
      <section className="panel overflow-hidden">
        <div className="border-b border-ink-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Customer feedback
              </h2>

              <p className="text-xs text-ink-400">
                Every submission is stored before any Google redirect.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
              />

              <input
                className="input-field pl-9"
                placeholder="Search feedback…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {feedbackLoading ? (
          <div className="p-6 text-sm text-ink-300">Loading feedback…</div>
        ) : filteredFeedback.length === 0 ? (
          <EmptyState
            title="No feedback yet"
            text="Customer submissions will appear here automatically."
          />
        ) : (
          <div className="divide-y divide-ink-100">
            {filteredFeedback.map((item) => (
              <FeedbackRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackRow({ item }) {
  const score = Number(item.overall_score || 0);

  return (
    <article className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            score > 4
              ? "bg-signal-500/10 text-signal-600"
              : "bg-ink-50 text-ink-600"
          }`}
        >
          <Star size={16} className="mr-0.5 fill-current" />
          {score.toFixed(1)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-300">
              {formatDate(item.created_at)}
            </span>

            {item.redirected_to_google && (
              <span className="rounded-full bg-signal-500/10 px-2 py-0.5 text-[10px] font-bold text-signal-600">
                Google redirect
              </span>
            )}
          </div>

          {item.comment && (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink-700">
              {item.comment}
            </p>
          )}

          {item.reasons?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700"
                >
                  {feedbackReasonLabel(reason)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function feedbackReasonLabel(reason) {
  return {
    service_speed: "Service speed",
    staff_attitude: "Staff attitude",
    product_quality: "Product or service quality",
  }[reason] || reason;
}

/* -------------------------------------------------------------------------- */
/* SHARED COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

function ScoreBar({ label, value }) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-medium text-ink-700">{label}</span>

        <span className="font-bold text-ink-900">{safe.toFixed(2)}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
        <div
          className="h-full rounded-full bg-signal-500 transition-all"
          style={{
            width: `${safe * 20}%`,
          }}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value, suffix = "", icon: Icon }) {
  return (
    <div className="panel p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>

        <Icon size={17} className="text-signal-500" />
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          {value}
        </span>

        {suffix && <span className="text-sm text-ink-300">{suffix}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3">
      <p className="text-xs text-ink-400">{label}</p>

      <p className="mt-1 text-lg font-bold text-ink-900">{value}</p>
    </div>
  );
}

function PageHeading({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-400">
          {description}
        </p>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="p-8 text-center">
      <p className="font-medium text-ink-700">{title}</p>

      <p className="mt-1 text-sm text-ink-400">{text}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="panel h-28 animate-pulse bg-ink-50" />
      ))}
    </div>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="panel h-28 animate-pulse bg-ink-50" />
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
