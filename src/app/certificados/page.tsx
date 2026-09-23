"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Certificado = {
  id: string;
  voluntario: string;
  voluntarioEmail: string;
  qtdeHoras: number;
  atividade: string;
  entidade: string;
  status: string;
  arquivoUrl: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  Pendente: "bg-[#fef3c7] text-[#d97706]",
  Emitido:  "bg-[#dcfce7] text-[#16a34a]",
  Aprovado: "bg-[#dcfce7] text-[#16a34a]",
  Rejeitado:"bg-[#fee2e2] text-[#dc2626]",
};

const STATUS_OPTS = ["Todos", "Pendente", "Emitido", "Aprovado", "Rejeitado"];

export default function CertificadosPage() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [pronto,       setPronto]       = useState(false);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [carregando,   setCarregando]   = useState(true);
  const [toast,        setToast]        = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  const [busca,        setBusca]        = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [emitindo,     setEmitindo]     = useState<string | null>(null);
  const [emitidoOk,    setEmitidoOk]    = useState<string | null>(null);

  // Modal de horas
  const [modalHoras,   setModalHoras]   = useState<Certificado | null>(null);
  const [horasInput,   setHorasInput]   = useState("");

  // ── Hooks (devem vir ANTES de qualquer return condicional) ─────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
    } catch { router.replace("/login"); return; }
    setPronto(true);
  }, [router]);

  useEffect(() => {
    if (!pronto) return;
    (async () => {
      try {
        let url = "/api/certificados";
        try {
          const raw = localStorage.getItem("usuario");
          if (raw) {
            const u = JSON.parse(raw);
            if (u.tipo === "Entidade" && u.cnpjEntidade) {
              url = `/api/certificados?cnpjEntidade=${encodeURIComponent(u.cnpjEntidade)}`;
            }
          }
        } catch {}
        const res  = await fetch(url);
        const data = await res.json();
        setCertificados(Array.isArray(data) ? data : []);
      } catch { setCertificados([]); }
      finally  { setCarregando(false); }
    })();
  }, [pronto]);

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return certificados.filter((c) => {
      const matchTexto = !q || (
        (c.voluntario ?? "").toLowerCase().includes(q) ||
        (c.atividade  ?? "").toLowerCase().includes(q) ||
        (c.entidade   ?? "").toLowerCase().includes(q)
      );
      const matchStatus = filtroStatus === "Todos" || c.status === filtroStatus;
      return matchTexto && matchStatus;
    });
  }, [certificados, busca, filtroStatus]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!pronto) return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function showToast(msg: string, tipo: "ok" | "erro") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 5000);
  }

  function abrirModalHoras(cert: Certificado) {
    setHorasInput(cert.qtdeHoras > 0 ? String(cert.qtdeHoras) : "");
    setModalHoras(cert);
  }

  async function confirmarEmissao() {
    if (!modalHoras) return;
    const horas = Number(horasInput);
    if (!horasInput || isNaN(horas) || horas < 0) {
      showToast("Informe uma quantidade de horas válida.", "erro");
      return;
    }
    const certId = modalHoras.id;
    setModalHoras(null);
    setEmitindo(certId);
    try {
      const res  = await fetch(`/api/certificados/${certId}/enviar-email`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ qtdeHoras: horas }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error ?? "Erro ao emitir certificado.", "erro");
      } else {
        setCertificados((prev) =>
          prev.map((c) => c.id === certId
            ? { ...c, status: "Emitido", qtdeHoras: horas, arquivoUrl: data.arquivoUrl ?? c.arquivoUrl }
            : c)
        );
        setEmitidoOk(certId);
        showToast("Certificado emitido e email enviado com sucesso!", "ok");
        setTimeout(() => setEmitidoOk(null), 4000);
      }
    } catch {
      showToast("Erro inesperado. Tente novamente.", "erro");
    } finally {
      setEmitindo(null);
    }
  }

  async function emitirCertificado(certId: string) {
    // Mantido para backward compat (certificados antigos sem modal)
    setEmitindo(certId);
    try {
      const res  = await fetch(`/api/certificados/${certId}/enviar-email`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error ?? "Erro ao emitir certificado.", "erro");
      } else {
        setCertificados((prev) =>
          prev.map((c) => c.id === certId
            ? { ...c, status: "Emitido", arquivoUrl: data.arquivoUrl ?? c.arquivoUrl }
            : c)
        );
        setEmitidoOk(certId);
        showToast("Certificado emitido e email enviado com sucesso!", "ok");
        setTimeout(() => setEmitidoOk(null), 4000);
      }
    } catch {
      showToast("Erro inesperado. Tente novamente.", "erro");
    } finally {
      setEmitindo(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] font-bold leading-tight text-[#1e3a8a]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Certificados
          </h1>
          <p className="mt-2 text-base text-[#475569]">Horas de voluntariado registradas</p>
        </div>
        <Link href="/certificados/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] md:self-auto self-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Emitir novo certificado
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por voluntário, atividade ou entidade..."
            className="w-full rounded-xl border border-[#bfdbfe] bg-white py-2.5 pl-10 pr-9 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15" />
          {busca && (
            <button type="button" onClick={() => setBusca("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:text-[#475569]" aria-label="Limpar">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTS.map((s) => (
            <button key={s} type="button" onClick={() => setFiltroStatus(s)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                filtroStatus === s
                  ? "bg-[#1d4ed8] text-white shadow-sm"
                  : "border border-[#bfdbfe] bg-white text-[#1e3a8a] hover:bg-[#eff6ff] [border-width:0.5px]"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="space-y-3">
          {[0,1,2].map((k) => (
            <div key={k} className="h-24 rounded-2xl bg-[#dbeafe] opacity-60"
              style={{ animation: "certSkel 1.2s ease-in-out infinite" }} />
          ))}
          <style>{`@keyframes certSkel { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#dbeafe]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-[16px] font-medium text-[#475569]">
            {busca || filtroStatus !== "Todos"
              ? "Nenhum certificado encontrado com esses filtros."
              : "Nenhum certificado registrado ainda."}
          </p>
          {!busca && filtroStatus === "Todos" && (
            <Link href="/certificados/novo" className="mt-4 text-[14px] font-semibold text-[#1d4ed8] hover:underline">
              Registrar o primeiro
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((cert) => {
            const statusClass = STATUS_STYLE[cert.status] ?? "bg-[#f1f5f9] text-[#475569]";
            const isPendente  = cert.status === "Pendente";
            const isEmitido   = cert.status === "Emitido" || cert.status === "Aprovado";
            const temArquivo  = !!cert.arquivoUrl;

            return (
              <div key={cert.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 transition-all [border-width:0.5px] hover:border-[#bfdbfe] hover:shadow-[0_2px_12px_rgba(29,78,216,0.07)] sm:flex-row sm:items-center sm:gap-6">

                {/* Horas */}
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-[10px] border border-[#93c5fd] bg-[#eff6ff] px-2 py-3 text-center [border-width:0.5px]">
                  <span className="text-2xl font-bold leading-none text-[#1d4ed8]">{cert.qtdeHoras}</span>
                  <span className="mt-1 text-[10px] font-medium uppercase text-[#1d4ed8]">
                    {cert.qtdeHoras === 1 ? "hora" : "horas"}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-[#1e3a8a]">{cert.voluntario}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass}`}>
                      {cert.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#64748b]">{cert.atividade}</p>
                  {cert.entidade && (
                    <p className="mt-0.5 text-[12px] text-[#94a3b8]">{cert.entidade}</p>
                  )}
                </div>

                {/* Ações */}
                <div className="shrink-0">
                  {/* Pendente SEM arquivo: só botão Emitir */}
                  {isPendente && !temArquivo && (
                    <button type="button" onClick={() => abrirModalHoras(cert)}
                      disabled={emitindo === cert.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e9d5ff] bg-[#faf5ff] px-3.5 py-2 text-[13px] font-semibold text-[#7c3aed] transition-colors hover:bg-[#ede9fe] [border-width:0.5px] disabled:opacity-60">
                      {emitindo === cert.id
                        ? <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Emitindo...</>
                        : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>Emitir certificado</>
                      }
                    </button>
                  )}

                  {/* Pendente COM arquivo OU Emitido COM arquivo */}
                  {(isPendente || isEmitido) && temArquivo && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={cert.arquivoUrl as string} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-2 text-[13px] font-semibold text-[#16a34a] transition-colors hover:bg-[#dcfce7] [border-width:0.5px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        Visualizar
                      </a>

                      <a href={`/api/certificados/download?url=${encodeURIComponent(cert.arquivoUrl as string)}&filename=${encodeURIComponent(`certificado-${cert.voluntario.replace(/\s+/g, "-").toLowerCase()}.pdf`)}`}
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-2 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] [border-width:0.5px]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </a>

                      {isPendente && (
                        <button type="button" onClick={() => abrirModalHoras(cert)}
                          disabled={emitindo === cert.id}
                          title={cert.voluntarioEmail ? `Enviar para ${cert.voluntarioEmail}` : "Email do voluntário não cadastrado"}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors [border-width:0.5px] disabled:cursor-not-allowed disabled:opacity-60
                            ${emitidoOk === cert.id
                              ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a]"
                              : "border-[#e9d5ff] bg-[#faf5ff] text-[#7c3aed] hover:bg-[#ede9fe]"
                            }`}>
                          {emitindo === cert.id ? (
                            <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>Emitindo...</>
                          ) : emitidoOk === cert.id ? (
                            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>Emitido!</>
                          ) : (
                            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>Emitir certificado</>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de horas */}
      {modalHoras && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setModalHoras(null)} aria-label="Fechar" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.18)]">
            <h3 className="mb-1 text-[18px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Emitir certificado
            </h3>
            <p className="mb-5 text-[13px] text-[#64748b]">
              <span className="font-medium text-[#1e3a8a]">{modalHoras.voluntario}</span>
              {" — "}{modalHoras.atividade}
            </p>

            <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
              Quantidade de horas <span className="text-[#dc2626]">*</span>
            </label>
            <input
              type="number" min="0" step="0.5"
              value={horasInput}
              onChange={(e) => setHorasInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmarEmissao()}
              placeholder="Ex: 4"
              autoFocus
              className="w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalHoras(null)}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f8faff] [border-width:0.5px]">
                Cancelar
              </button>
              <button type="button" onClick={confirmarEmissao}
                className="inline-flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#6d28d9]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Confirmar e enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-3 rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] ${toast.tipo === "ok" ? "bg-[#16a34a] text-white" : "bg-[#dc2626] text-white"}`}>
          {toast.tipo === "ok"
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          }
          <span className="text-[14px] font-semibold">{toast.msg}</span>
          <button type="button" onClick={() => setToast(null)} className="ml-1 opacity-80 hover:opacity-100" aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
