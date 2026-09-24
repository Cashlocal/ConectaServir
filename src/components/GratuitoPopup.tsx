"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "popup-gratuito-visto";

const checks = [
  "Sem taxa de cadastro",
  "Sem mensalidade para entidades",
  "Sem cartão de crédito, nunca",
];

export function GratuitoPopup() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function fechar() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  function participar() {
    fechar();
    router.push("/voluntarios");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-gratuito-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={fechar}
        aria-label="Fechar"
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        {/* Fechar X */}
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar popup"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#94a3b8] transition-colors hover:bg-[#f1f5f9] hover:text-[#475569]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm">
          🎁 100% GRATUITO
        </div>

        {/* Título */}
        <h2
          id="popup-gratuito-title"
          className="mb-3 text-[1.6rem] font-black uppercase leading-tight tracking-tight text-[#1a2e44]"
        >
          FAZER O BEM É{" "}
          <span className="text-amber-500">GRATUITO</span>
        </h2>

        {/* Descrição */}
        <p className="mb-5 text-[14px] leading-relaxed text-[#475569]">
          O ConectaServir é uma iniciativa do Rotary Club de Pato Branco.
          Voluntários, entidades e projetos sociais usam a plataforma sem
          nenhum custo.
        </p>

        {/* Checklist */}
        <ul className="mb-6 space-y-2.5 rounded-xl bg-[#f8faff] px-5 py-4">
          {checks.map((item) => (
            <li key={item} className="flex items-center gap-3 text-[14px] font-semibold text-[#1e3a8a]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={participar}
            className="flex-1 rounded-xl bg-[#1a44a6] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#153575]"
          >
            Entendi, quero participar
          </button>
          <button
            type="button"
            onClick={fechar}
            className="flex-1 rounded-xl border border-[#e2e8f0] px-4 py-3 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:1px]"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
