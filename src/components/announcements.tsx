"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { markAnnouncementsReadAction } from "@/app/_actions/avisos";

/** Sino com contador de avisos não lidos; abrir o menu marca todos como lidos. */
export function AnnouncementsBell({ unread, children }: { unread: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const count = seen ? 0 : unread;
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && count > 0) {
      setSeen(true);
      start(() => markAnnouncementsReadAction());
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={count > 0 ? `Avisos (${count} novos)` : "Avisos"}
        className="relative grid h-11 w-11 place-items-center rounded-2xl text-muted hover:bg-black/5 hover:text-foreground"
      >
        <Bell aria-hidden className="h-5 w-5" />
        {count > 0 && (
          <span aria-hidden className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-extrabold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Avisos" className="clay absolute right-0 top-12 z-40 max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto p-4">
          {children}
        </div>
      )}
    </div>
  );
}
