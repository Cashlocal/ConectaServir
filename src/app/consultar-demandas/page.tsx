"use client";

import { useEffect, useState } from "react";

type Demanda = {
  id: string;
  nome: string;
  descricao: string;
  entidade: string;
  entidadeTelefone: string;
  entidadeEmail: string;
  status: string;
};

type Contato = {
  entidade: string;
  telefone: string;
  email: string;
  anchorRect: DOMRect;
} | null;

export default function ConsultarDemandasPage() {
  const [demandas, setDemandas]   = useState<Demanda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]         = useState("");
  const [contato, setContato]     = useState<Contato>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const res  = await fetch("/api/demandas?status=Em+Aberto");
        const data = await res.json();
        setDemandas(Array.isArray(data) ? data : []);
      } catch {
        setDemandas([]);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  // Fecha o popover ao pressionar Esc ou clicar fora
  useEffect(() => {
    if (!contato) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setContato(null); }
    function onClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-popover]") && !target.closest("[data-contato-btn]")) {
        setContato(null);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [contato]);

  function abrirContato(e: React.MouseEvent<HTMLButtonElement>, d: Demanda) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (contato?.entidade === d.entidade && contato?.email === d.entidadeEmail) {
      setContato(null);
      return;
    }
    setContato({
      entidade: d.entidade,
      telefone: d.entidadeTelefone,
      email:    d.entidadeEmail,
      anchorRect: rect,
    });
  }

  const q = busca.toLowerCase();
  const filtrados = q
    ? demandas.filter(
        (d) =>
          d.nome.toLowerCase().includes(q) ||
          d.descricao.toLowerCase().includes(q) ||
          d.entidade.toLowerCase().includes(q)
      )
    : demandas;

  // Posição do popover: abaixo do botão ou acima se não houver espaço
  function popoverStyle(): React.CSSProperties {
    if (!contato) return {};
    const { anchorRect } = contato;
    const popH = 140;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const top = spaceBelow >= popH + 8
      ? anchorRect.bottom + window.scrollY + 8
      : anchorRect.top  + window.scrollY - popH - 8;
    const left = Math.min(
      anchorRect.left + window.scrollX,
      window.innerWidth - 280 - 16
    );
    return { position: "absolute", top, left, width: 272 };
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[var(--fundo-secao)] px-6 py-16 lg:px-16">
      {/* Cabeçalho */}
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 text-center">
          <h1
            className="text-[32px] font-bold leading-tight text-[#1a2e44] md:text-[2.5rem]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Demandas em aberto
          </h1>
          <p className="mt-3 text-base text-[#4a5e6a]">
            Veja as demandas que precisam de apoio e entre em contato com a instituição responsável.
          </p>
        </div>

        {/* Campo de busca */}
        <div className="relative mx-auto mb-10 max-w-xl">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por demanda, descrição ou instituição..."
            className="w-full rounded-xl border border-[#bfdbfe] bg-white py-3 pl-11 pr-10 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none shadow-sm [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:text-[#475569]"
              aria-label="Limpar busca"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Cards */}
        {carregando ? (
          <div className="flex items-center justify-center py-24 text-[#94a3b8]">
            <svg className="mr-3 h-5 w-5 animate-spin text-[#1a44a6]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Carregando demandas...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#1a44a6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <p className="text-[16px] font-semibold text-[#1e3a8a]">
              {busca ? "Nenhuma demanda encontrada para essa busca" : "Nenhuma demanda em aberto no momento"}
            </p>
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                className="mt-3 text-sm text-[#1a44a6] underline underline-offset-2"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-[#64748b]">
              {filtrados.length} {filtrados.length === 1 ? "demanda encontrada" : "demandas encontradas"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((d) => (
                <article
                  key={d.id}
                  className="group flex flex-col rounded-2xl border border-white/60 bg-white p-6 shadow-[0_2px_16px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(26,68,166,0.12)]"
                >
                  {/* Badge de status */}
                  <div className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#fef3c7] px-3 py-1 text-[12px] font-semibold text-[#b45309]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" aria-hidden />
                    Em Aberto
                  </div>

                  <h2 className="mb-2 text-[17px] font-bold leading-snug text-[#1e3a8a] transition-colors group-hover:text-[#1a44a6]">
                    {d.nome}
                  </h2>

                  {d.descricao && (
                    <p className="mb-4 flex-1 text-[14px] leading-relaxed text-[#475569]">
                      {d.descricao}
                    </p>
                  )}

                  {d.entidade && (
                    <div className="mb-4 flex items-center gap-2 text-[13px] text-[#64748b]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      <span className="font-medium text-[#334155]">{d.entidade}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-2">
                    <button
                      type="button"
                      data-contato-btn
                      onClick={(e) => abrirContato(e, d)}
                      disabled={!d.entidadeTelefone && !d.entidadeEmail}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a44a6] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#153575] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16l-.08.92z" />
                      </svg>
                      Entrar em contato
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Popover de contato */}
      {contato && (
        <>
          {/* Overlay transparente para fechar */}
          <div className="fixed inset-0 z-[290]" onClick={() => setContato(null)} aria-hidden />

          <div
            data-popover
            role="dialog"
            aria-label={`Contato — ${contato.entidade}`}
            className="z-[300] rounded-2xl border border-[#bfdbfe] bg-white p-5 shadow-[0_8px_32px_rgba(29,78,216,0.18)] [border-width:0.5px]"
            style={popoverStyle()}
          >
            {/* Seta decorativa */}
            <div className="absolute -top-2 left-5 h-3 w-3 rotate-45 border-l border-t border-[#bfdbfe] bg-white [border-width:0.5px]" aria-hidden />

            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Contato</p>
                {contato.entidade && (
                  <p className="mt-0.5 text-[15px] font-bold text-[#1e3a8a]">{contato.entidade}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setContato(null)}
                className="shrink-0 rounded-lg p-1 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569]"
                aria-label="Fechar"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-2.5">
              {contato.telefone && (
                <a
                  href={`tel:${contato.telefone.replace(/\D/g, "")}`}
                  className="flex items-center gap-3 rounded-xl bg-[#eff6ff] px-3 py-2.5 text-[14px] font-medium text-[#1a44a6] transition-colors hover:bg-[#dbeafe]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .84h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16l-.08.92z" />
                  </svg>
                  {contato.telefone}
                </a>
              )}

              {contato.email && (
                <a
                  href={`mailto:${contato.email}`}
                  className="flex items-center gap-3 rounded-xl bg-[#eff6ff] px-3 py-2.5 text-[14px] font-medium text-[#1a44a6] transition-colors hover:bg-[#dbeafe]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span className="truncate">{contato.email}</span>
                </a>
              )}

              {!contato.telefone && !contato.email && (
                <p className="text-[13px] text-[#94a3b8]">Nenhum contato disponível.</p>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
