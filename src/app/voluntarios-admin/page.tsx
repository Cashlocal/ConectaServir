"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Voluntario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: "Ativo" | "Inativo";
  localizacao: string;
  sobreVoce: string;
  habilidades: string;
  disponibilidade: string;
  areasInteresse: string[];
};

type Certificado = {
  id: string;
  atividade: string;
  qtdeHoras: number;
  entidade: string;
  status: string;
  arquivoUrl: string | null;
};

type ModalState =
  | { tipo: "novo" }
  | { tipo: "editar"; voluntario: Voluntario }
  | null;

export default function VoluntariosAdminPage() {
  const router = useRouter();
  const [pronto, setPronto]           = useState(false);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [carregando, setCarregando]   = useState(true);
  const [busca, setBusca]             = useState("");
  const [modal, setModal]             = useState<ModalState>(null);
  const [salvando, setSalvando]       = useState(false);
  const [toggling, setToggling]       = useState<string | null>(null);
  const [erro, setErro]               = useState("");

  // Linha expandida
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [certs, setCerts]             = useState<Record<string, Certificado[] | "loading">>({});

  const [nome, setNome]         = useState("");
  const [email, setEmail]       = useState("");
  const [telefone, setTelefone] = useState("");

  const nomeRef = useRef<HTMLInputElement>(null);

  const [usuarioTipo, setUsuarioTipo]               = useState("");
  const [usuarioCnpj, setUsuarioCnpj]               = useState("");
  const [usuarioNomeEntidade, setUsuarioNomeEntidade] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
      const u = JSON.parse(raw);
      setUsuarioTipo(u.tipo ?? "");
      setUsuarioCnpj(u.cnpjEntidade ?? "");
      setUsuarioNomeEntidade(u.nomeEntidade ?? "");
    } catch {
      router.replace("/login"); return;
    }
    setPronto(true);
  }, [router]);

  useEffect(() => { if (pronto) carregarVoluntarios(); }, [pronto]);
  useEffect(() => { if (modal) setTimeout(() => nomeRef.current?.focus(), 50); }, [modal]);

  async function carregarVoluntarios() {
    setCarregando(true);
    try {
      const raw  = localStorage.getItem("usuario");
      const u    = raw ? JSON.parse(raw) : {};
      const cnpj = u.cnpjEntidade ?? "";
      const tipo = u.tipo ?? "";
      const url  = tipo === "Entidade" && cnpj
        ? `/api/voluntarios-admin?cnpjEntidade=${encodeURIComponent(cnpj)}`
        : "/api/voluntarios-admin";
      const res  = await fetch(url);
      const data = await res.json();
      setVoluntarios(Array.isArray(data) ? data : []);
    } catch {
      setVoluntarios([]);
    } finally {
      setCarregando(false);
    }
  }

  async function toggleExpand(v: Voluntario) {
    if (expandedId === v.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(v.id);
    if (!certs[v.id]) {
      setCerts((prev) => ({ ...prev, [v.id]: "loading" }));
      try {
        const res  = await fetch(`/api/certificados?voluntarioId=${v.id}`);
        const data = await res.json();
        setCerts((prev) => ({ ...prev, [v.id]: Array.isArray(data) ? data : [] }));
      } catch {
        setCerts((prev) => ({ ...prev, [v.id]: [] }));
      }
    }
  }

  function abrirNovo() {
    setNome(""); setEmail(""); setTelefone(""); setErro("");
    setModal({ tipo: "novo" });
  }

  function abrirEditar(v: Voluntario) {
    setNome(v.nome); setEmail(v.email); setTelefone(v.telefone); setErro("");
    setModal({ tipo: "editar", voluntario: v });
  }

  function fechar() { setModal(null); setErro(""); }

  async function salvar() {
    if (!nome.trim()) { setErro("O campo Nome é obrigatório."); return; }
    if (!email.trim()) { setErro("O campo Email é obrigatório."); return; }
    setSalvando(true); setErro("");

    try {
      const isEditar = modal?.tipo === "editar";
      const url    = isEditar
        ? `/api/voluntarios-admin/${(modal as { tipo: "editar"; voluntario: Voluntario }).voluntario.id}`
        : "/api/voluntarios-admin";
      const method = isEditar ? "PATCH" : "POST";

      const body: Record<string, string> = { nome, email, telefone };
      if (!isEditar && usuarioTipo === "Entidade") {
        if (usuarioNomeEntidade) body.nomeEntidade = usuarioNomeEntidade;
        if (usuarioCnpj)         body.cnpjEntidade = usuarioCnpj;
      }

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      if (isEditar) {
        setVoluntarios((prev) => prev.map((v) => (v.id === data.id ? { ...v, ...data } : v)));
      } else {
        setVoluntarios((prev) =>
          [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
        );
      }
      fechar();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function toggleStatus(v: Voluntario) {
    const novoStatus = v.status === "Ativo" ? "Inativo" : "Ativo";
    setToggling(v.id);
    setVoluntarios((prev) =>
      prev.map((item) => (item.id === v.id ? { ...item, status: novoStatus } : item))
    );
    try {
      const res = await fetch(`/api/voluntarios-admin/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        setVoluntarios((prev) =>
          prev.map((item) => (item.id === v.id ? { ...item, status: v.status } : item))
        );
      }
    } catch {
      setVoluntarios((prev) =>
        prev.map((item) => (item.id === v.id ? { ...item, status: v.status } : item))
      );
    } finally {
      setToggling(null);
    }
  }

  if (!pronto) return null;

  const q = busca.toLowerCase();
  const filtrados = q
    ? voluntarios.filter(
        (v) =>
          v.nome.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.telefone.toLowerCase().includes(q) ||
          v.localizacao.toLowerCase().includes(q) ||
          v.habilidades.toLowerCase().includes(q) ||
          v.disponibilidade.toLowerCase().includes(q) ||
          v.areasInteresse.some((a) => a.toLowerCase().includes(q))
      )
    : voluntarios;

  const inputClass =
    "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Voluntários
          </h1>
          <p className="mt-1 text-base text-[#475569]">Gerencie os voluntários cadastrados</p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] sm:self-auto"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Voluntário
        </button>
      </div>

      {/* Campo de busca */}
      <div className="relative mb-4">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, email, telefone, localização, habilidades..."
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

      <div className="overflow-hidden rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
        {carregando ? (
          <div className="flex items-center justify-center py-20 text-[#94a3b8]">
            <svg className="mr-3 h-5 w-5 animate-spin text-[#1d4ed8]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Carregando voluntários...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1e3a8a]">
              {busca ? "Nenhum voluntário encontrado para essa busca" : "Nenhum voluntário cadastrado"}
            </p>
            {!busca && <p className="mt-1 text-sm text-[#94a3b8]">Clique em "Novo Voluntário" para começar.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="w-8 px-3 py-3.5" />
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Nome</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Email</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">Telefone</th>
                  <th className="px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ativo</th>
                  <th className="w-20 px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtrados.map((v) => {
                  const expanded = expandedId === v.id;
                  const certData = certs[v.id];
                  return (
                    <>
                      <tr key={v.id} className="transition-colors hover:bg-[#f8faff]">
                        {/* Botão expandir */}
                        <td className="px-3 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(v)}
                            className="rounded p-1 text-[#94a3b8] transition-all hover:text-[#1d4ed8]"
                            aria-label={expanded ? "Recolher" : "Expandir"}
                            title={expanded ? "Recolher detalhes" : "Ver detalhes"}
                          >
                            <svg
                              width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                              aria-hidden="true"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-[#1e3a8a]">{v.nome}</td>
                        <td className="px-6 py-4 text-[#475569]">{v.email || <span className="text-[#cbd5e1]">—</span>}</td>
                        <td className="hidden px-6 py-4 text-[#475569] md:table-cell">{v.telefone || <span className="text-[#cbd5e1]">—</span>}</td>
                        <td className="px-6 py-4 text-center">
                          <label className="inline-flex cursor-pointer items-center" title={v.status === "Ativo" ? "Clique para inativar" : "Clique para ativar"}>
                            <input
                              type="checkbox"
                              checked={v.status === "Ativo"}
                              disabled={toggling === v.id}
                              onChange={() => toggleStatus(v)}
                              className="sr-only"
                            />
                            <span className={`relative inline-block h-5 w-9 rounded-full transition-colors duration-200 ${toggling === v.id ? "opacity-50" : ""} ${v.status === "Ativo" ? "bg-[#1d4ed8]" : "bg-[#cbd5e1]"}`}>
                              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${v.status === "Ativo" ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => abrirEditar(v)}
                            className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                            aria-label={`Editar ${v.nome}`}
                            title="Editar"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* Linha expandida */}
                      {expanded && (
                        <tr key={`${v.id}-detail`}>
                          <td colSpan={6} className="border-t border-[#e2e8f0] bg-[#f0f6ff] px-6 py-5">
                            <div className="grid gap-6 md:grid-cols-2">
                              {/* Dados do voluntário */}
                              <div>
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Informações do voluntário</p>
                                <dl className="space-y-2 text-[13px]">
                                  {[
                                    { label: "Localização",      val: v.localizacao     },
                                    { label: "Disponibilidade",  val: v.disponibilidade },
                                    { label: "Habilidades",      val: v.habilidades     },
                                    { label: "Sobre",            val: v.sobreVoce       },
                                  ].map(({ label, val }) =>
                                    val ? (
                                      <div key={label} className="flex gap-2">
                                        <dt className="w-28 shrink-0 font-medium text-[#475569]">{label}:</dt>
                                        <dd className="text-[#1e3a8a]">{val}</dd>
                                      </div>
                                    ) : null
                                  )}
                                  {v.areasInteresse.length > 0 && (
                                    <div className="flex gap-2">
                                      <dt className="w-28 shrink-0 font-medium text-[#475569]">Áreas:</dt>
                                      <dd className="flex flex-wrap gap-1">
                                        {v.areasInteresse.map((a) => (
                                          <span key={a} className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-medium text-[#1e3a8a]">{a}</span>
                                        ))}
                                      </dd>
                                    </div>
                                  )}
                                </dl>
                              </div>

                              {/* Certificados */}
                              <div>
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Certificados gerados</p>
                                {certData === "loading" ? (
                                  <div className="flex items-center gap-2 text-[13px] text-[#94a3b8]">
                                    <svg className="h-4 w-4 animate-spin text-[#1d4ed8]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Carregando...
                                  </div>
                                ) : !certData || certData.length === 0 ? (
                                  <p className="text-[13px] text-[#94a3b8]">Nenhum certificado gerado.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {(certData as Certificado[]).map((c) => (
                                      <div key={c.id} className="flex items-center justify-between rounded-xl border border-[#bfdbfe] bg-white px-4 py-2.5 [border-width:0.5px]">
                                        <div>
                                          <p className="text-[13px] font-medium text-[#1e3a8a]">{c.atividade}</p>
                                          <p className="text-[11px] text-[#64748b]">
                                            {c.qtdeHoras > 0 && `${c.qtdeHoras}h`}
                                            {c.entidade && ` · ${c.entidade}`}
                                            {` · `}
                                            <span className={`font-medium ${c.status === "Gerado" ? "text-[#16a34a]" : "text-[#d97706]"}`}>{c.status}</span>
                                          </p>
                                        </div>
                                        {c.arquivoUrl && (
                                          <a
                                            href={c.arquivoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-3 shrink-0 rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                                            title="Ver certificado"
                                          >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                              <polyline points="14 2 14 8 20 8" />
                                              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                            </svg>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal criar / editar */}
      {modal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <h2 className="mb-6 text-[22px] font-bold text-[#1e3a8a]" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              {modal.tipo === "novo" ? "Novo Voluntário" : "Editar Voluntário"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome completo <span className="text-[#dc2626]">*</span>
                </label>
                <input ref={nomeRef} type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva" className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Email <span className="text-[#dc2626]">*</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@email.com" className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Telefone</label>
                <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 00000-0000" className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }} />
              </div>

              {erro && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {erro}
                </div>
              )}
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={fechar} disabled={salvando}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:0.5px]">
                Cancelar
              </button>
              <button type="button" onClick={salvar} disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-60">
                {salvando ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Salvando...
                  </>
                ) : (modal.tipo === "novo" ? "Cadastrar" : "Salvar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
