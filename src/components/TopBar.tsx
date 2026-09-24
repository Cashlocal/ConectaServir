"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "topbar-gratuito-dismissed";

export function TopBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-[#0f2050] px-10 py-2.5 text-center text-[13px] text-white">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="shrink-0 text-rose-400"
        aria-hidden="true"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      <span>
        <strong>Plataforma 100% gratuita</strong> para voluntários e entidades
        &nbsp;·&nbsp; uma iniciativa do Rotary Club de Pato Branco
      </span>
      <Link
        href="/contato"
        className="ml-1 font-semibold underline underline-offset-2 hover:text-amber-300 transition-colors"
      >
        Entre em contato
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar faixa"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 transition-colors hover:text-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
