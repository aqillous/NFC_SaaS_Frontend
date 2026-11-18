import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MessageSquare, CreditCard, Users, Settings, Copy } from "lucide-react";
import toast from "react-hot-toast";
import * as api from "../lib/api";

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "users", label: "Users", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [entityResponse, subscriptionsResponse, reviewsResponse, usersResponse] = await Promise.all([
        api.getEntity(id),
        api.listSubscriptions({ entity_id: id }),
        api.listEntityFeedback(id, { skip: 0, limit: 200 }),
        api.listUsers(),
      ]);
      setEntity(entityResponse.data);
      setSubscriptions(subscriptionsResponse.data);
      setReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);
      setUsers(usersResponse.data.filter((user) => user.entity_id === id));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not load this business");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const currentSubscription = useMemo(
    () => [...subscriptions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null,
    [subscriptions],
  );

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-ink-100" />
        <div className="h-12 animate-pulse rounded-xl bg-ink-100" />
        <div className="h-72 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="panel p-10 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Business unavailable</h1>
        <p className="mt-2 text-sm text-ink-400">{error || "This business could not be found."}</p>
        <button type="button" className="btn-primary mt-5" onClick={load}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <Link to="/entities" className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-400 hover:text-ink-700">
        <ArrowLeft size={16} /> Back to businesses
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white">
            {entity.name?.[0]?.toUpperCase() || "B"}
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{entity.name}</h1>
            <p className="mt-1 text-sm text-ink-400">{entity.type === "RESTAURANT" ? "Restaurant" : "Hotel"}</p>
          </div>
        </div>
        <button type="button" className="btn-secondary hidden sm:inline-flex" onClick={() => navigate(`/entities/${id}/edit`)}>
          Edit
        </button>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-ink-100 bg-white p-1" role="tablist">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={activeTab === tabId}
            onClick={() => setActiveTab(tabId)}
            className={`flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              activeTab === tabId ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="font-display text-lg font-semibold text-ink-900">Business details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div><dt className="text-ink-300">Status</dt><dd className="mt-1 font-semibold text-ink-700">{entity.is_active ? "Active" : "Inactive"}</dd></div>
              <div><dt className="text-ink-300">Google review URL</dt><dd className="mt-1 break-all text-signal-600">{entity.google_review_url}</dd></div>
              <div><dt className="text-ink-300">NFC URL</dt><dd className="mt-1 break-all font-mono text-xs text-ink-700">{entity.nfc_url}</dd></div>
            </dl>
          </section>
          <section className="panel p-5">
            <h2 className="font-display text-lg font-semibold text-ink-900">Recent activity</h2>
            <p className="mt-4 text-sm text-ink-400">{reviews.length} reviews stored.</p>
          </section>
        </div>
      )}

      {activeTab === "reviews" && (
        <section className="panel overflow-hidden">
          {reviews.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-400">No reviews yet.</div>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="border-b border-ink-100 p-5 last:border-0">
                <p className="text-sm font-semibold text-ink-800">{Number(review.overall_score || 0).toFixed(1)} / 5</p>
                {review.comment && <p className="mt-2 text-sm leading-6 text-ink-600">{review.comment}</p>}
              </article>
            ))
          )}
        </section>
      )}

      {activeTab === "subscription" && (
        <section className="panel p-5">
          {currentSubscription ? (
            <dl className="grid gap-4 sm:grid-cols-3">
              <div><dt className="text-xs text-ink-300">Status</dt><dd className="mt-1 font-semibold text-ink-800">{currentSubscription.status}</dd></div>
              <div><dt className="text-xs text-ink-300">Starts</dt><dd className="mt-1 font-semibold text-ink-800">{new Date(currentSubscription.starts_at).toLocaleDateString()}</dd></div>
              <div><dt className="text-xs text-ink-300">Ends</dt><dd className="mt-1 font-semibold text-ink-800">{new Date(currentSubscription.ends_at).toLocaleDateString()}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-ink-400">No subscription found.</p>
          )}
        </section>
      )}

      {activeTab === "users" && (
        <section className="panel overflow-hidden">
          {users.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-400">No business users yet.</div>
          ) : users.map((user) => (
            <div key={user.id} className="border-b border-ink-100 p-4 text-sm text-ink-700 last:border-0">{user.email}</div>
          ))}
        </section>
      )}

      {activeTab === "settings" && (
        <section className="panel p-5">
          <p className="text-sm leading-6 text-ink-400">Manage business details and subscription settings.</p>
          <button type="button" className="btn-primary mt-4" onClick={() => navigate(`/entities/${id}/edit`)}>Edit business</button>
        </section>
      )}
    </div>
  );
}
