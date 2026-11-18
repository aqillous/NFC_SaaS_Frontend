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
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import * as api from "../lib/api";
import StatTile from "../components/StatTile.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDashboardLanguage } from "../context/DashboardLanguageContext.jsx";
import {
  DASHBOARD_COPY,
  DATE_LOCALES,
} from "../lib/dashboardTranslations.js";
import { formatDate as formatDateISO, relativeDays } from "../lib/formatters.js";

export default function Dashboard() {
  const { user } = useAuth();
  const { language, setLanguage } = useDashboardLanguage();

  return user?.is_superuser ? (
    <AdminDashboard language={language} setLanguage={setLanguage} />
  ) : (
    <RestaurantDashboard language={language} setLanguage={setLanguage} />
  );
}

/* -------------------------------------------------------------------------- */
/* ADMIN DASHBOARD                                                            */
/* -------------------------------------------------------------------------- */

function AdminDashboard({ language, setLanguage }) {
  const t = DASHBOARD_COPY[language];
  const [stats, setStats] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  const load = () => {
    setLoading(true);

    Promise.all([
      api.getDashboardStats(),
      api.listSubscriptions({}),
      api.listEntities({}),
    ])
      .then(([statsResponse, subscriptionsResponse, businessesResponse]) => {
        setStats(statsResponse.data);
        setSubscriptions(subscriptionsResponse.data);
        setBusinesses(businessesResponse.data);
      })
      .catch((error) => {
        toast.error(
          error.response?.data?.detail || t.loadingStats,
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
        title={t.dashboard}
        description={t.dashboardDescription}
        action={
          <DashboardToolbar
            language={language}
            setLanguage={setLanguage}
            loading={loading}
            onRefresh={load}
            t={t}
          />
        }
      />

      {loading ? (
        <SkeletonGrid />
      ) : stats ? (
        <div className="space-y-4">
          <NeedsAttention
            subscriptions={subscriptions}
            businesses={businesses}
            language={language}
          />

          <section>
            <SectionHeading title={language === "az" ? "Bizneslər" : "Businesses"} />
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile
              label={t.totalEntities}
              value={stats.total_entities}
              icon={Building2}
              accent="ink"
              to="/entities"
              viewLabel={language === "az" ? "Bax" : "View"}
            />

            <StatTile
              label={t.restaurants}
              value={stats.total_restaurants}
              icon={UtensilsCrossed}
              accent="ink"
              to="/entities?type=RESTAURANT"
              viewLabel={language === "az" ? "Bax" : "View"}
            />

            <StatTile
              label={t.hotels}
              value={stats.total_hotels}
              icon={BedDouble}
              accent="ink"
              to="/entities?type=HOTEL"
              viewLabel={language === "az" ? "Bax" : "View"}
            />
            </div>
          </section>

          <section>
            <SectionHeading title={language === "az" ? "Abunəliklər" : "Subscriptions"} />
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile
              label={t.activeSubscriptions}
              value={stats.active_subscriptions}
              icon={CheckCircle2}
              accent="signal"
              to="/subscriptions?status=ACTIVE"
              viewLabel={language === "az" ? "Bax" : "View"}
            />

            <StatTile
              label={t.expiredSubscriptions}
              value={stats.expired_subscriptions}
              icon={XCircle}
              accent="rust"
              to="/subscriptions?status=EXPIRED"
              viewLabel={language === "az" ? "Bax" : "View"}
              muted={Number(stats.expired_subscriptions) === 0}
            />

            <StatTile
              label={t.expiringSoon}
              value={stats.expiring_soon}
              icon={AlertTriangle}
              accent="amber"
              to="/subscriptions?status=EXPIRING_SOON"
              viewLabel={language === "az" ? "Bax" : "View"}
              muted={Number(stats.expiring_soon) === 0}
            />
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <SectionHeading title={language === "az" ? "Google keçidləri" : "Google redirects"} />
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                disabled
                aria-label={language === "az" ? "Tarix aralığı" : "Date range"}
                title={language === "az" ? "TODO: API tarix aralığı dəstəklənməyib" : "TODO: API range support not available"}
                className="h-10 rounded-xl border border-ink-100 bg-ink-50 px-3 text-xs font-semibold text-ink-400"
              >
                <option value="today">{language === "az" ? "Bu gün" : "Today"}</option>
                <option value="7">7 {language === "az" ? "gün" : "days"}</option>
                <option value="30">30 {language === "az" ? "gün" : "days"}</option>
                <option value="month">{language === "az" ? "Bu ay" : "This month"}</option>
              </select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatTile
                label={t.googleOpensToday}
                value={stats.scans_today}
                icon={ExternalLink}
                accent="signal"
              />
              <StatTile
                label={t.googleOpensMonth}
                value={stats.scans_this_month}
                icon={CalendarDays}
                accent="signal"
              />
            </div>
          </section>

          {/* Feedback overview */}
          <section>
            <SectionHeading title={language === "az" ? "Rəylər" : "Reviews"} />
            <div className="panel mt-3 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  {t.feedbackOverview}
                </h2>

                <p className="text-xs text-ink-400">
                  {t.allBusinessFeedback}
                </p>
              </div>

              <div className="rounded-full bg-signal-500/10 px-3 py-1 text-xs font-bold text-signal-600">
                {stats.total_feedback} {t.submissions}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <RatingMetric
                label={t.averageRating}
                value={Number(stats.average_feedback_score || 0)}
              />

              <FeedbackMetric
                label={t.googleOpens}
                value={stats.google_redirects}
                icon={ExternalLink}
              />

              <FeedbackMetric
                label={t.redirectRate}
                value={`${Number(stats.google_redirect_rate || 0).toFixed(1)}%`}
                icon={TrendingUp}
                tooltip={language === "az" ? "Google-a yönləndirilən rəylərin bütün rəylərə nisbəti." : "The percentage of all feedback submissions redirected to Google."}
              />

              <FeedbackMetric
                label={t.thisMonthReviews}
                value={stats.feedback_this_month}
                icon={MessageSquare}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
              <MiniStat
                label={t.feedbackToday}
                value={stats.feedback_today ?? 0}
              />

              <MiniStat
                label={t.internalFeedback}
                value={stats.internal_feedback ?? 0}
                tooltip={language === "az" ? "Yalnız bizneslə paylaşılıb, Google-a yönləndirilməyən rəylər." : "Feedback kept with the business and not sent to Google."}
              />
            </div>
            <FeedbackFunnel stats={stats} language={language} />
            </div>
          </section>
          <section>
            <SectionHeading title={language === "az" ? "Qrafiklər" : "Charts"} />
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="panel flex h-48 items-center justify-center border-dashed p-5 text-center">
                <p className="text-sm text-ink-400">
                  <span className="font-semibold text-ink-600">TODO:</span>{" "}
                  {language === "az" ? "Günlər üzrə rəy qrafiki" : "Reviews per day chart"}
                </p>
              </div>
              <div className="panel flex h-48 items-center justify-center border-dashed p-5 text-center">
                <p className="text-sm text-ink-400">
                  <span className="font-semibold text-ink-600">TODO:</span>{" "}
                  {language === "az" ? "Qiymət paylanması" : "Rating distribution chart"}
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <EmptyState
          title={t.dashboardLoadFailed}
          text={t.refreshPage}
        />
      )}
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <h2 className="font-display text-lg font-semibold text-ink-900">
      {title}
    </h2>
  );
}

function NeedsAttention({ subscriptions, businesses, language }) {
  const rows = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 86400000;
    return subscriptions
      .filter((subscription) => {
        const end = new Date(subscription.ends_at).getTime();
        return end < now || end - now <= thirtyDays;
      })
      .sort((a, b) => {
        const aExpired = new Date(a.ends_at).getTime() < now;
        const bExpired = new Date(b.ends_at).getTime() < now;
        if (aExpired !== bExpired) return aExpired ? -1 : 1;
        return new Date(a.ends_at) - new Date(b.ends_at);
      })
      .slice(0, 5);
  }, [subscriptions]);

  const businessMap = useMemo(
    () => Object.fromEntries(businesses.map((business) => [business.id, business.name])),
    [businesses],
  );

  return (
    <section className="rounded-2xl border border-amber-500/20 border-l-4 border-l-amber-500 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {language === "az" ? "Diqqət tələb edir" : "Needs attention"}
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            {language === "az"
              ? "Müddəti bitmiş və ya 30 günə bitəcək abunəliklər"
              : "Subscriptions that are expired or ending within 30 days"}
          </p>
          </div>
        </div>
        <Link to="/subscriptions?status=EXPIRING_SOON" className="shrink-0 text-xs font-bold text-amber-700 hover:underline">
          {language === "az" ? "Hamısına bax" : "View all"}
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-signal-500/5 p-3 text-sm text-signal-700">
          <CheckCircle2 size={18} />
          {language === "az" ? "Hamısı yenidir" : "Everything is up to date"}
        </div>
      ) : (
        <div className="mt-3 divide-y divide-ink-100">
          {rows.map((subscription) => {
            const expired = new Date(subscription.ends_at).getTime() < Date.now();
            const name = businessMap[subscription.entity_id] || subscription.entity_name || "—";
            return (
              <Link
                key={subscription.id}
                to={`/subscriptions?business=${encodeURIComponent(name)}&status=${expired ? "EXPIRED" : "EXPIRING_SOON"}`}
                className="group flex items-center gap-3 py-2.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white">
                  {name?.[0]?.toUpperCase() || "B"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800 group-hover:text-signal-600">{name}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{formatDateISO(subscription.ends_at, language)}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${expired ? "bg-rust-500/10 text-rust-500" : "bg-amber-500/10 text-amber-700"}`}>
                  {relativeDays(subscription.ends_at, language)}
                </span>
                <span className="text-xs font-bold text-signal-600">{language === "az" ? "Yenilə" : "Renew"}</span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RatingMetric({ label, value }) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="rounded-xl bg-ink-50 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</span>
        <Star size={16} className="text-amber-500" />
      </div>
      <p className="mt-2 text-xl font-bold text-ink-900">{safe.toFixed(2)} / 5</p>
      <div className="mt-2 flex gap-1" aria-label={`${safe.toFixed(2)} out of 5`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, safe - index));
          return (
            <span key={index} className="relative h-4 w-4">
              <Star size={16} className="absolute text-ink-200" />
              {fill > 0 && (
                <span className="absolute left-0 top-0 h-4 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackFunnel({ stats, language }) {
  const taps = Number(stats.scans_this_month || 0);
  const ratings = Number(stats.total_feedback || 0);
  const redirects = Number(stats.google_redirects || 0);
  const privateFeedback = Number(stats.internal_feedback || 0);
  const steps = [
    { label: language === "az" ? "Keçidlər" : "Taps", value: taps },
    { label: language === "az" ? "Rəy verilib" : "Rating given", value: ratings },
    { label: language === "az" ? "Google keçidi" : "Google redirect", value: redirects },
    { label: language === "az" ? "Bizneslə paylaşılan" : "Private feedback", value: privateFeedback },
  ];
  return (
    <div className="mt-5 border-t border-ink-100 pt-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.label} className="relative rounded-xl bg-ink-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{step.label}</p>
            <p className="mt-1 text-lg font-bold text-ink-900">{step.value}</p>
            {index < steps.length - 1 && <span className="absolute right-[-7px] top-1/2 z-10 hidden h-3 w-3 -rotate-45 border-b border-r border-ink-100 bg-ink-50 sm:block" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeedbackMetric({ label, value, icon: Icon, tooltip }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold uppercase tracking-wide text-ink-400"
          title={tooltip}
        >
          {label}
          {tooltip && <span className="ml-1 text-ink-300" aria-label={tooltip}>ⓘ</span>}
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

function RestaurantDashboard({ language, setLanguage }) {
  const t = DASHBOARD_COPY[language];
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
        error.response?.data?.detail || t.loadingBusiness,
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
        ...(item.reasons || []).map((reason) => feedbackReasonLabel(reason, t)),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [feedback, language, query, t]);

  if (loading && !dashboard) {
    return <RestaurantSkeleton />;
  }

  const stats = dashboard?.stats;
  const daily = dashboard?.daily || [];

  const maxSubmissions = Math.max(1, ...daily.map((item) => item.submissions));

  return (
    <div className="space-y-5">
      <PageHeading
        title={dashboard?.entity_name || t.businessDashboard}
        description={t.businessDescription}
        action={
          <DashboardToolbar
            language={language}
            setLanguage={setLanguage}
            loading={loading}
            onRefresh={load}
            t={t}
          />
        }
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label={t.averageScore}
          value={stats?.average_score?.toFixed(2) || "0.00"}
          suffix="/ 5"
          icon={Star}
        />

        <MetricCard
          label={t.feedbackReceived}
          value={stats?.total_submissions ?? 0}
          icon={MessageSquare}
        />

        <MetricCard
          label={t.googleOpens}
          value={stats?.google_redirects ?? 0}
          icon={TrendingUp}
        />

        <MetricCard
          label={t.redirectRate}
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
                {t.reviewPerformance}
              </h2>

              <p className="text-xs text-ink-400">
                {t.submissionsOverTime}
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
                  {value}{t.daysSuffix}
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
                      title={`${item.submissions} ${t.submissionsTooltip} • ${item.google_redirects} ${t.googleOpensTooltip} • ${item.average_score.toFixed(2)} ${t.averageTooltip}`}
                    />
                  </div>

                  <span className="mt-2 -rotate-45 origin-top-left whitespace-nowrap text-[9px] text-ink-300">
                    {new Date(`${item.date}T00:00:00`).toLocaleDateString(
                      DATE_LOCALES[language],
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
                {t.noSubmissions}
              </div>
            )}
          </div>
        </section>

        {/* Overall rating */}
        <section className="panel p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                {t.overallRating}
              </h2>

              <p className="text-xs text-ink-400">
                {t.averageCustomerRating}
              </p>
            </div>

            <div className="rounded-full bg-signal-500/10 px-2.5 py-1 text-xs font-bold text-signal-600">
              {t.maxRating}
            </div>
          </div>

          <div className="mt-6">
            <ScoreBar
              label={t.averageRating}
              value={stats?.average_score || 0}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-4">
            <MiniStat label={t.today} value={stats?.submissions_today ?? 0} />

            <MiniStat
              label={t.thisMonthReviews}
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
                {t.customerFeedback}
              </h2>

              <p className="text-xs text-ink-400">
                {t.feedbackStored}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
              />

              <input
                className="input-field pl-9"
                placeholder={t.searchFeedback}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {feedbackLoading ? (
          <div className="p-6 text-sm text-ink-300">{t.loadingFeedback}</div>
        ) : filteredFeedback.length === 0 ? (
          <EmptyState
            title={t.noFeedback}
            text={t.feedbackWillAppear}
          />
        ) : (
          <div className="divide-y divide-ink-100">
            {filteredFeedback.map((item) => (
              <FeedbackRow
                key={item.id}
                item={item}
                language={language}
                t={t}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedbackRow({ item, language, t }) {
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
              {formatDate(item.created_at, language)}
            </span>

            {item.redirected_to_google && (
              <span className="rounded-full bg-signal-500/10 px-2 py-0.5 text-[10px] font-bold text-signal-600">
                {t.googleRedirect}
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
                  {feedbackReasonLabel(reason, t)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function feedbackReasonLabel(reason, t) {
  return {
    service_speed: t.serviceSpeed,
    staff_attitude: t.staffAttitude,
    product_quality: t.productQuality,
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

function DashboardToolbar({ language, setLanguage, loading, onRefresh, t }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onRefresh}
        className="btn-secondary"
        disabled={loading}
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        {t.refresh}
      </button>
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

function MiniStat({ label, value, tooltip }) {
  return (
    <div className="rounded-xl bg-ink-50 p-3">
      <p className="text-xs text-ink-400" title={tooltip}>
        {label}
        {tooltip && <span className="ml-1 text-ink-300" aria-label={tooltip}>ⓘ</span>}
      </p>
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

function formatDate(value, language) {
  if (!value) return "";

  return new Date(value).toLocaleString(DATE_LOCALES[language], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
