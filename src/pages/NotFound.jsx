import { ArrowLeft, MapPinOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff_0,_#f3f6f8_58%,_#e7edf0_100%)] px-4 py-10">
      <section className="panel w-full max-w-lg px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-500">
          <MapPinOff size={28} strokeWidth={1.8} />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-signal-600">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-400">
          The page you are looking for does not exist or may have moved.
        </p>

        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
          <Link to="/dashboard" className="btn-primary">
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
