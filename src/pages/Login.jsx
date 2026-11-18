import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import rateUpLogo from "../images/RateUp_logo.png";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Invalid email or password",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top_left,_#ffffff_0,_#f3f6f8_58%,_#e7edf0_100%)] px-4 py-8 sm:px-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-panel md:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden flex-col justify-between bg-ink-950 p-8 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <img src={rateUpLogo} alt="" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Rate UP</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">Review platform</p>
            </div>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold leading-tight">Manage every customer touchpoint.</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
              Track subscriptions, feedback, and NFC reviews from one clear workspace.
            </p>
          </div>
          <p className="text-xs text-white/40">Secure administrator access</p>
        </aside>

        <main className="px-5 py-8 sm:px-10 sm:py-10">
          <div className="mb-7 flex flex-col items-center text-center md:items-start md:text-left">
            <div className="mb-5 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-ink-100 bg-[#FAFBFC] shadow-subtle md:hidden">
            <img
              src={rateUpLogo}
              alt="Rate Up"
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-signal-600">Admin portal</p>
          <h1 className="font-display text-3xl font-semibold text-ink-900">
            Rate UP Admin
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-400">
            Sign in to manage entities and subscriptions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div role="alert" className="rounded-lg bg-rust-500/8 px-3.5 py-2.5 text-sm text-rust-500">
              {error}
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input-field"
              placeholder="admin@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="input-field pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-300 hover:text-ink-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        </main>
      </div>
    </div>
  );
}
