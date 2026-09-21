"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Projeto = {
  id: string;
  nomeProjeto: string;
  descricao: string;
  categoria: string;
  localizacao: string;
  voluntariosNecessarios: number;
  nomeResponsavel: string;
  email: string;
  telefone: string;
  entidadeId: string;
  entidade: string;
};

const CATEGORIA_COLORS: Record<string, string> = {
  "Educação":              "bg-[#dbeafe] text-[#1e40af]",
  "Saúde":                 "bg-[#dcfce7] text-[#166534]",
  "Meio Ambiente":         "bg-[#d1fae5] text-[#065f46]",
  "Assistência Social":    "bg-[#fef3c7] text-[#92400e]",
  "Cultura":               "bg-[#ede9fe] text-[#5b21b6]",
  "Esporte":               "bg-[#fee2e2] text-[#991b1b]",
  "Geração de Renda":      "bg-[#fce7f3] text-[#9d174d]",
  "Habitação":             "bg-[#e0e7ff] text-[#3730a3]",
};

function categoriaBadge(cat: string) {
  return CATEGORIA_COLORS[cat] ?? "bg-[#f1f5f9] text-[#475569]";
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    fetch("/api/projetos")
      .then((r) => r.json())
      .then((d) => setProjetos(Array.isArray(d) ? d : []))
      .catch(() => setProjetos([]))
      .finally(() => setCarregando(false));
  }, []);

  const q = busca.toLowerCase();
  const filtrados = q
    ? projetos.filter(
        (p) =>
          p.nomeProjeto.toLowerCase().includes(q) ||
          p.descricao.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.localizacao.toLowerCase().includes(q) ||
          p.entidade.toLowerCase().includes(q)
      )
    : projetos;

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1
            className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Projetos Sociais
          </h1>
          <p className="mt-1 text-base text-[#475569]">
            Iniciativas sociais do Rotary Club de Pato Branco
          </p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, categoria, entidade ou localização..."
          className="w-full rounded-xl border border-[#bfdbfe] bg-white py-3 pl-11 pr-10 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15"
        />
        {busca && (
          <button type="button" onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:text-[#475569]"
            aria-label="Limpar busca">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Cards */}
      {carregando ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="h-52 rounded-2xl bg-[#dbeafe] opacity-50"
              style={{ animation: "skelProjeto 1.2s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes skelProjeto { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#bfdbfe] bg-white py-24 [border-width:0.5px]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-[#1e3a8a]">
            {busca ? "Nenhum projeto encontrado" : "Nenhum projeto cadastrado ainda"}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <div key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(29,78,216,0.07)] transition-all [border-width:0.5px] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(29,78,216,0.12)]"
            >
              {/* Topo colorido */}
              <div className="flex items-start justify-between gap-2 bg-[#f8faff] px-5 py-4">
                <h2 className="text-[15px] font-semibold leading-snug text-[#1e3a8a]">
                  {p.nomeProjeto}
                </h2>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${categoriaBadge(p.categoria)}`}>
                  {p.categoria || "—"}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                <p className="line-clamp-3 text-[13px] leading-relaxed text-[#475569]">
                  {p.descricao || <span className="text-[#cbd5e1]">Sem descrição.</span>}
                </p>

                <div className="mt-auto space-y-1.5 pt-2 text-[12px] text-[#64748b]">
                  {p.entidade && (
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span className="font-medium text-[#1e3a8a]">{p.entidade}</span>
                    </div>
                  )}
                  {p.localizacao && (
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{p.localizacao}</span>
                    </div>
                  )}
                  {p.voluntariosNecessarios > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <span>{p.voluntariosNecessarios} voluntário{p.voluntariosNecessarios !== 1 ? "s" : ""} necessário{p.voluntariosNecessarios !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {p.nomeResponsavel && (
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>{p.nomeResponsavel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rodapé com contato */}
              {(p.email || p.telefone) && (
                <div className="flex items-center gap-3 border-t border-[#f1f5f9] px-5 py-3">
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-[12px] text-[#1d4ed8] hover:underline">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                      {p.email}
                    </a>
                  )}
                  {p.telefone && (
                    <a href={`tel:${p.telefone}`} className="flex items-center gap-1.5 text-[12px] text-[#1d4ed8] hover:underline">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.02 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                      </svg>
                      {p.telefone}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
