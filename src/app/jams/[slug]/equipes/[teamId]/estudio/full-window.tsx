"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Ocupa a janela inteira abaixo do menu do site (sem rolagem), como a lição. */
export function FullWindow({ children }: { children: ReactNode }) {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    const update = () => setTop(header ? header.getBoundingClientRect().bottom : 0);
    update();
    const ro = new ResizeObserver(update);
    if (header) ro.observe(header);
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      ro.disconnect();
      html.style.overflow = prev;
    };
  }, []);
  return <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col bg-background" style={{ top }}>{children}</div>;
}
