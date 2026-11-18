import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export default function RowActionsMenu({ label = "Actions", items }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((current) => !current)}
        aria-label={label}
        aria-expanded={open}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white p-1 shadow-panel"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              disabled={item.disabled}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                item.danger
                  ? "text-rust-500 hover:bg-rust-500/5"
                  : "text-ink-700 hover:bg-ink-50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
