"use client";

import { useEffect, useRef, useState } from "react";

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
  entidadeLogo?: string | null;
};

type VolEncontrado = { id: string; nome: string; email: string; telefone: string };

type EtapaModal =
  | "telefone"
  | "encontrado"
  | "nao-encontrado"
  | "sucesso";

const CATEGORIA_COLORS: Record<string, string> = {
  "Educação":           "bg-[#dbeafe] text-[#1e40af]",
  "Saúde":              "bg-[#dcfce7] text-[#166534]",
  "Meio Ambiente":      "bg-[#d1fae5] text-[#065f46]",
  "Assistência Social": "bg-[#fef3c7] text-[#92400e]",
  "Cultura":            "bg-[#ede9fe] text-[#5b21b6]",
  "Esporte":            "bg-[#fee2e2] text-[#991b1b]",
  "Geração de Renda":   "bg-[#fce7f3] text-[#9d174d]",
  "Habitação":          "bg-[#e0e7ff] text-[#3730a3]",
};
function categoriaBadge(cat: string) { return CATEGORIA_COLORS[cat] ?? "bg-[#f1f5f9] text-[#475569]"; }

const AREAS = [
  "Saúde","Educação","Meio Ambiente","Assistência Social",
  "Cultura","Esporte","Tecnologia","Outro",
];

const inputCls = "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-2.5 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

export default function ProjetosPage() {
  const [projetos, setProjetos]     = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]           = useState("");

  // Modal state
  const [projetoSel, setProjetoSel]   = useState<Projeto | null>(null);
  const [etapa, setEtapa]             = useState<EtapaModal>("telefone");
  const [telefone, setTelefone]       = useState("");
  const [buscando, setBuscando]       = useState(false);
  const [volEnc, setVolEnc]           = useState<VolEncontrado | null>(null);
  const [salvando, setSalvando]       = useState(false);
  const [erroModal, setErroModal]     = useState("");

  // Campos de novo cadastro
  const [novoNome, setNovoNome]               = useState("");
  const [novoEmail, setNovoEmail]             = useState("");
  const [novoTel, setNovoTel]                 = useState("");
  const [novoLocal, setNovoLocal]             = useState("");
  const [novoSobre, setNovoSobre]             = useState("");
  const [novoHab, setNovoHab]                 = useState("");
  const [novoDisp, setNovoDisp]               = useState("");
  const [novasAreas, setNovasAreas]           = useState<string[]>([]);

  const telRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/projetos")
      .then((r) => r.json())
      .then((d) => setProjetos(Array.isArray(d) ? d : []))
      .catch(() => setProjetos([]))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    if (projetoSel) setTimeout(() => telRef.current?.focus(), 50);
  }, [projetoSel]);

  function abrirModal(p: Projeto) {
    setProjetoSel(p); setEtapa("telefone");
    setTelefone(""); setVolEnc(null); setErroModal("");
    setNovoNome(""); setNovoEmail(""); setNovoTel("");
    setNovoLocal(""); setNovoSobre(""); setNovoHab("");
    setNovoDisp(""); setNovasAreas([]);
  }
  function fecharModal() { setProjetoSel(null); }

  async function buscarVoluntario() {
    if (!telefone.trim()) { setErroModal("Informe o telefone."); return; }
    setBuscando(true); setErroModal("");
    try {
      const res  = await fetch(`/api/voluntarios/buscar?telefone=${encodeURIComponent(telefone)}`);
      const data = await res.json();
      if (data?.id) {
        setVolEnc(data);
        setEtapa("encontrado");
      } else {
        setNovoTel(telefone);
        setEtapa("nao-encontrado");
      }
    } catch { setErroModal("Erro ao buscar. Tente novamente.");
    } finally { setBuscando(false); }
  }

  async function vincular(voluntarioId: string) {
    if (!projetoSel) return;
    setSalvando(true); setErroModal("");
    try {
      const res  = await fetch(`/api/projetos/${projetoSel.id}/vincular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voluntarioId }),
      });
      const data = await res.json();
      if (!res.ok) { setErroModal(data.error ?? "Erro ao salvar."); return; }
      setEtapa("sucesso");
    } catch { setErroModal("Erro inesperado. Tente novamente.");
    } finally { setSalvando(false); }
  }

  async function cadastrarEVincular() {
    if (!novoNome.trim())  { setErroModal("Nome é obrigatório."); return; }
    if (!novoEmail.trim()) { setErroModal("Email é obrigatório."); return; }
    if (!projetoSel) return;
    setSalvando(true); setErroModal("");
    try {
      const res  = await fetch("/api/voluntarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome:          novoNome,
          email:         novoEmail,
          telefone:      novoTel,
          localizacao:   novoLocal,
          sobreVoce:     novoSobre,
          habilidades:   novoHab,
          disponibilidade: novoDisp,
          areasInteresse:  novasAreas,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErroModal(data.error ?? "Erro ao cadastrar voluntário."); return; }
      await vincular(data.id ?? data.record?.id);
    } catch { setErroModal("Erro inesperado. Tente novamente.");
    } finally { setSalvando(false); }
  }

  function toggleArea(a: string) {
    setNovasAreas((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  const q = busca.toLowerCase();
  const filtrados = q
    ? projetos.filter((p) =>
        p.nomeProjeto.toLowerCase().includes(q) ||
        p.descricao.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.localizacao.toLowerCase().includes(q) ||
        p.entidade.toLowerCase().includes(q))
    : projetos;

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Projetos Sociais
          </h1>
          <p className="mt-1 text-base text-[#475569]">Iniciativas sociais do Rotary Club de Pato Branco</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, categoria, entidade ou localização..."
          className="w-full rounded-xl border border-[#bfdbfe] bg-white py-3 pl-11 pr-10 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15" />
        {busca && (
          <button type="button" onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:text-[#475569]" aria-label="Limpar busca">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Cards */}
      {carregando ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0,1,2,3,4,5].map((k) => (
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
              className="flex flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(29,78,216,0.07)] transition-all [border-width:0.5px] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(29,78,216,0.12)]">
              {/* Topo */}
              <div className="flex items-start justify-between gap-2 bg-[#f8faff] px-5 py-4">
                <h2 className="text-[15px] font-semibold leading-snug text-[#1e3a8a]">{p.nomeProjeto}</h2>
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
                      {p.entidadeLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.entidadeLogo} alt={p.entidade}
                          className="h-4 w-4 shrink-0 rounded object-contain" />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      )}
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

              {/* Contato */}
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

              {/* Botão voluntariar */}
              <div className="border-t border-[#f1f5f9] px-5 py-3">
                <button type="button" onClick={() => abrirModal(p)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1e40af]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 11l2 2 4-4" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="10" cy="7" r="4" />
                  </svg>
                  Quero me voluntariar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {projetoSel && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={fecharModal} aria-label="Fechar" />
          <div className="relative w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-[0_8px_40px_rgba(29,78,216,0.18)]" style={{ maxHeight: "90vh" }}>

            {/* Cabeçalho do modal */}
            <div className="flex items-start justify-between gap-3 border-b border-[#e2e8f0] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Quero me voluntariar</p>
                <h3 className="mt-0.5 text-[16px] font-bold text-[#1e3a8a]">{projetoSel.nomeProjeto}</h3>
              </div>
              <button type="button" onClick={fecharModal}
                className="mt-0.5 shrink-0 rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569]" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">

              {/* ETAPA 1 — Busca por telefone */}
              {etapa === "telefone" && (
                <div className="space-y-4">
                  <p className="text-[14px] text-[#475569]">
                    Para confirmar sua participação, informe seu <strong>telefone</strong> para verificarmos seu cadastro.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Telefone</label>
                    <input ref={telRef} type="tel" value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && buscarVoluntario()}
                      placeholder="(00) 00000-0000" className={inputCls} />
                  </div>
                  {erroModal && <p className="text-[13px] text-red-600">{erroModal}</p>}
                  <button type="button" onClick={buscarVoluntario} disabled={buscando}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-60">
                    {buscando ? (<><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>Buscando...</>) : "Continuar"}
                  </button>
                </div>
              )}

              {/* ETAPA 2 — Voluntário encontrado */}
              {etapa === "encontrado" && volEnc && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 [border-width:0.5px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-[15px] font-bold text-white">
                      {volEnc.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#166534]">{volEnc.nome}</p>
                      <p className="text-[12px] text-[#4ade80]">{volEnc.email}</p>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#475569]">
                    Cadastro localizado! Confirme sua participação no projeto <strong>{projetoSel.nomeProjeto}</strong>.
                  </p>
                  {erroModal && <p className="text-[13px] text-red-600">{erroModal}</p>}
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setEtapa("telefone"); setVolEnc(null); }}
                      className="flex-1 rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f8faff] [border-width:0.5px]">
                      Voltar
                    </button>
                    <button type="button" onClick={() => vincular(volEnc.id)} disabled={salvando}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#15803d] disabled:opacity-60">
                      {salvando ? "Confirmando..." : "Confirmar participação"}
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 3 — Não encontrado: cadastro */}
              {etapa === "nao-encontrado" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e] [border-width:0.5px]">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Telefone não encontrado. Complete seu cadastro de voluntário abaixo para participar.
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Nome completo <span className="text-red-500">*</span></label>
                      <input type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Seu nome" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Email <span className="text-red-500">*</span></label>
                      <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="seu@email.com" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Telefone</label>
                      <input type="tel" value={novoTel} onChange={(e) => setNovoTel(e.target.value)} placeholder="(00) 00000-0000" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Localização</label>
                      <input type="text" value={novoLocal} onChange={(e) => setNovoLocal(e.target.value)} placeholder="Cidade / Estado" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Sobre você</label>
                      <textarea value={novoSobre} onChange={(e) => setNovoSobre(e.target.value)} rows={2} placeholder="Conte um pouco sobre você..." className={`${inputCls} resize-none`} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Habilidades</label>
                      <input type="text" value={novoHab} onChange={(e) => setNovoHab(e.target.value)} placeholder="Ex: ensino, primeiros socorros..." className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Disponibilidade</label>
                      <input type="text" value={novoDisp} onChange={(e) => setNovoDisp(e.target.value)} placeholder="Ex: fins de semana..." className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#1e3a8a]">Áreas de interesse</label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {AREAS.map((a) => (
                          <button key={a} type="button" onClick={() => toggleArea(a)}
                            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${novasAreas.includes(a) ? "bg-[#1d4ed8] text-white" : "border border-[#bfdbfe] bg-white text-[#1e3a8a] hover:bg-[#eff6ff] [border-width:0.5px]"}`}>
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {erroModal && <p className="text-[13px] text-red-600">{erroModal}</p>}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setEtapa("telefone")}
                      className="flex-1 rounded-xl border border-[#e2e8f0] px-4 py-2.5 text-[14px] font-medium text-[#475569] hover:bg-[#f8faff] [border-width:0.5px]">
                      Voltar
                    </button>
                    <button type="button" onClick={cadastrarEVincular} disabled={salvando}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-60">
                      {salvando ? "Cadastrando..." : "Cadastrar e confirmar"}
                    </button>
                  </div>
                </div>
              )}

              {/* ETAPA 4 — Sucesso */}
              {etapa === "sucesso" && (
                <div className="flex flex-col items-center py-4 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <h4 className="text-[18px] font-bold text-[#166534]">Participação confirmada!</h4>
                  <p className="mt-2 text-[14px] text-[#475569]">
                    Você foi vinculado ao projeto <strong>{projetoSel.nomeProjeto}</strong>. Em breve entraremos em contato.
                  </p>
                  <button type="button" onClick={fecharModal}
                    className="mt-6 rounded-xl bg-[#1d4ed8] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af]">
                    Fechar
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </main>
  );
}
