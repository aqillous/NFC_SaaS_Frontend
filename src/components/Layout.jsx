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
  Search,
  Globe,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { useDashboardLanguage } from "../context/DashboardLanguageContext.jsx";
import { DASHBOARD_COPY } from "../lib/dashboardTranslations.js";
import * as api from "../lib/api.js";

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

  const { language, setLanguage } = useDashboardLanguage();
  const t = DASHBOARD_COPY[language];

  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    const handleCommand = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handleCommand);
    return () => window.removeEventListener("keydown", handleCommand);
  }, []);

  useEffect(() => {
    if (!commandOpen) return;
    api.listEntities({}).then(({ data }) => setBusinesses(data)).catch(() => setBusinesses([]));
  }, [commandOpen]);

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
          onClick={closeMenu}
          className={({ isActive }) =>
            `mx-1 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-ink-100 bg-white lg:flex">
        <Brand t={t} />

        <div className="flex-1">
          <NavItems />
        </div>

        <Account user={user} onSignOut={handleSignOut} t={t} />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/40 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[82vw] max-w-80 flex-col border-r border-ink-100 bg-white shadow-panel transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <Brand t={t} />

          <button
            className="icon-btn mr-3"
            ref={closeButtonRef}
            onClick={closeMenu}
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

      <main className="min-h-screen lg:ml-60">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-ink-100/80 bg-ink-50/95 px-6 backdrop-blur lg:flex">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-10 w-72 items-center gap-2 rounded-xl border border-ink-100 bg-white px-3 text-sm text-ink-400 shadow-subtle transition hover:border-ink-200"
            aria-label={t.search}
          >
            <Search size={16} />
            <span className="flex-1 text-left">{t.commandPlaceholder}</span>
            <kbd className="rounded-md border border-ink-100 bg-ink-50 px-1.5 py-0.5 text-[10px] font-bold text-ink-400">⌘K</kbd>
          </button>
          <LanguageSwitch language={language} setLanguage={setLanguage} />
        </header>
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-ink-100/80 bg-ink-50/90 px-4 backdrop-blur lg:hidden">
          <button
            className="icon-btn"
            ref={menuButtonRef}
            onClick={() => setOpen(true)}
            aria-label={t.openMenu}
          >
            <Menu size={20} />
          </button>

          <span className="ml-2 font-display text-lg font-semibold text-ink-900">
            Rate UP
          </span>
          <div className="ml-auto">
            <LanguageSwitch language={language} setLanguage={setLanguage} compact />
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {children}
        </div>
      </main>
      {commandOpen && (
        <CommandPalette
          businesses={businesses}
          language={language}
          t={t}
          onClose={() => setCommandOpen(false)}
        />
      )}
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
          <p className="truncate text-sm font-semibold text-ink-900" title={user?.email}>
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

function LanguageSwitch({ language, setLanguage, compact = false }) {
  return (
    <div className="flex items-center rounded-xl border border-ink-100 bg-white p-1" aria-label="Language">
      {["az", "en"].map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`min-h-8 rounded-lg px-2.5 text-xs font-bold transition ${
            language === code
              ? "bg-ink-900 text-white"
              : "text-ink-400 hover:text-ink-700"
          } ${compact ? "px-2" : ""}`}
          aria-label={code === "az" ? "Azərbaycan dili" : "English"}
          aria-pressed={language === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function CommandPalette({ businesses, language, t, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const copy = language === "az";

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const pages = [
    { label: copy ? "İdarə paneli" : "Dashboard", path: "/dashboard", words: "dashboard panel" },
    { label: copy ? "Bizneslər" : "Businesses", path: "/entities", words: "businesses entities" },
    { label: copy ? "Abunəliklər" : "Subscriptions", path: "/subscriptions", words: "subscriptions" },
    { label: copy ? "İstifadəçilər" : "Users", path: "/users", words: "users" },
  ];

  const needle = query.trim().toLowerCase();
  const filteredPages = pages.filter((item) =>
    `${item.label} ${item.words}`.toLowerCase().includes(needle),
  );
  const filteredBusinesses = needle
    ? businesses
        .filter((business) => business.name?.toLowerCase().includes(needle))
        .slice(0, 6)
    : [];

  const jump = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-ink-950/40 px-4 pt-[10vh] backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close search"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.search}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-panel"
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4">
          <Search size={18} className="text-ink-300" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.commandPlaceholder}
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-300"
            aria-label={t.search}
          />
          <kbd className="rounded-md border border-ink-100 px-1.5 py-0.5 text-[10px] text-ink-400">ESC</kbd>
        </div>
        <div className="max-h-[420px] overflow-y-auto p-2">
          {filteredPages.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => jump(item.path)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              {item.label}
              <span className="text-xs font-normal text-ink-300">Page</span>
            </button>
          ))}
          {filteredBusinesses.map((business) => (
            <button
              key={business.id}
              type="button"
              onClick={() => jump(`/entities/${business.id}`)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              {business.name}
              <span className="text-xs font-normal text-ink-300">{copy ? "Biznes" : "Business"}</span>
            </button>
          ))}
          {needle && filteredPages.length === 0 && filteredBusinesses.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-ink-400">{t.noCommandResults}</p>
          )}
        </div>
      </div>
    </div>
  );
}
