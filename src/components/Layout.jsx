import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  LogOut,
  Nfc,
  Menu,
  X,
  Users as UsersIcon,
} from "lucide-react";

import { useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { useDashboardLanguage } from "../context/DashboardLanguageContext.jsx";
import { DASHBOARD_COPY } from "../lib/dashboardTranslations.js";

const ADMIN_NAV = [
  {
    to: "/dashboard",
    label: "dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/entities",
    label: "entities",
    icon: Building2,
  },
  {
    to: "/subscriptions",
    label: "subscriptions",
    icon: CreditCard,
  },
  {
    to: "/users",
    label: "users",
    icon: UsersIcon,
  },
];

const RESTAURANT_NAV = [
  {
    to: "/dashboard",
    label: "dashboard",
    icon: LayoutDashboard,
  },
];

export default function Layout({ children }) {
  const { user, signOut } = useAuth();

  const navigate = useNavigate();

  const { language } = useDashboardLanguage();
  const t = DASHBOARD_COPY[language];

  const [open, setOpen] = useState(false);

  const nav = user?.is_superuser ? ADMIN_NAV : RESTAURANT_NAV;

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  const NavItems = () => (
    <nav className="space-y-1 px-3 py-4">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
              isActive
                ? "bg-ink-900 text-white shadow-sm"
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            }`
          }
        >
          <Icon size={18} strokeWidth={2} />

          {t[label]}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-100 bg-white md:flex">
        <Brand t={t} />

        <div className="flex-1">
          <NavItems />
        </div>

        <Account user={user} onSignOut={handleSignOut} t={t} />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-80 flex-col border-r border-ink-100 bg-white shadow-panel transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Brand t={t} />

          <button
            className="icon-btn mr-3"
            onClick={() => setOpen(false)}
            aria-label={t.closeMenu}
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1">
          <NavItems />
        </div>

        <Account user={user} onSignOut={handleSignOut} t={t} />
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-ink-100/80 bg-ink-50/90 px-4 backdrop-blur md:hidden">
          <button
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label={t.openMenu}
          >
            <Menu size={20} />
          </button>

          <span className="ml-2 font-display text-lg font-semibold text-ink-900">
            Rate UP
          </span>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function Brand({ t }) {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-ink-100 px-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white">
        <Nfc size={18} strokeWidth={2.2} />
      </div>

      <div>
        <p className="font-display text-[1.08rem] font-semibold tracking-tight text-ink-900">
          Rate UP
        </p>

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
          {t.reviewPlatform}
        </p>
      </div>
    </div>
  );
}

function Account({ user, onSignOut, t }) {
  return (
    <div className="border-t border-ink-100 p-3">
      <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-signal-500/10 text-sm font-bold text-signal-600">
          {user?.email?.[0]?.toUpperCase() || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {user?.email}
          </p>

          <p className="text-xs text-ink-400">
            {user?.is_superuser ? t.platformAdmin : t.businessAccount}
          </p>
        </div>

        <button
          onClick={onSignOut}
          className="icon-btn"
          title={t.signOut}
          aria-label={t.signOut}
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
