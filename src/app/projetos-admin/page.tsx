"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Entidade = { id: string; nome: string };

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

type ModalState =
  | { tipo: "novo" }
  | { tipo: "editar"; projeto: Projeto }
  | { tipo: "excluir"; projeto: Projeto }
  | null;

const CATEGORIAS = [
  "Educação","Saúde","Meio Ambiente","Assistência Social",
  "Cultura","Esporte","Geração de Renda","Habitação","Outro",
];

const emptyForm = {
  nomeProjeto: "", descricao: "", categoria: "", localizacao: "",
  voluntariosNecessarios: "", nomeResponsavel: "", email: "", telefone: "", entidadeId: "",
};

export default function ProjetosAdminPage() {
  const router = useRouter();
  const [pronto, setPronto]       = useState(false);
  const [projetos, setProjetos]   = useState<Projeto[]>([]);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]         = useState("");
  const [modal, setModal]         = useState<ModalState>(null);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState("");
  const [form, setForm]           = useState({ ...emptyForm });
  const [usuarioTipo, setUsuarioTipo]               = useState("");
  const [usuarioCnpj, setUsuarioCnpj]               = useState("");
  const [usuarioEntidadeId, setUsuarioEntidadeId]   = useState("");

  const nomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
      const u = JSON.parse(raw);
      setUsuarioTipo(u.tipo ?? "");
      setUsuarioCnpj(u.cnpjEntidade ?? "");
      setUsuarioEntidadeId(u.entidadeId ?? "");
    } catch { router.replace("/login"); return; }
    setPronto(true);
  }, [router]);

  useEffect(() => {
    if (!pronto) return;
    Promise.all([carregarProjetos(), carregarEntidades()]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  useEffect(() => {
    if (modal) setTimeout(() => nomeRef.current?.focus(), 50);
  }, [modal]);

  async function carregarProjetos() {
    setCarregando(true);
    try {
      const cnpj = localStorage.getItem("usuario")
        ? (JSON.parse(localStorage.getItem("usuario")!).cnpjEntidade ?? "")
        : "";
      const tipo = localStorage.getItem("usuario")
        ? (JSON.parse(localStorage.getItem("usuario")!).tipo ?? "")
        : "";
      const url = tipo === "Entidade" && cnpj
        ? `/api/projetos?cnpjEntidade=${encodeURIComponent(cnpj)}`
        : "/api/projetos";
      const res  = await fetch(url);
      const data = await res.json();
      setProjetos(Array.isArray(data) ? data : []);
    } catch { setProjetos([]); }
    finally { setCarregando(false); }
  }

  async function carregarEntidades() {
    try {
      const res  = await fetch("/api/entidades");
      const data = await res.json();
      setEntidades(Array.isArray(data) ? data : []);
    } catch { setEntidades([]); }
  }

  function abrirNovo() {
    const entId = usuarioTipo === "Entidade" ? usuarioEntidadeId : "";
    setForm({ ...emptyForm, entidadeId: entId }); setErro("");
    setModal({ tipo: "novo" });
  }

  function abrirEditar(p: Projeto) {
    setForm({
      nomeProjeto:            p.nomeProjeto,
      descricao:              p.descricao,
      categoria:              p.categoria,
      localizacao:            p.localizacao,
      voluntariosNecessarios: String(p.voluntariosNecessarios || ""),
      nomeResponsavel:        p.nomeResponsavel,
      email:                  p.email,
      telefone:               p.telefone,
      entidadeId:             p.entidadeId,
    });
    setErro("");
    setModal({ tipo: "editar", projeto: p });
  }

  function abrirExcluir(p: Projeto) {
    setErro(""); setModal({ tipo: "excluir", projeto: p });
  }

  function fechar() { setModal(null); setErro(""); }

  function set(field: string, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function salvar() {
    if (!form.nomeProjeto.trim()) { setErro("Nome do projeto é obrigatório."); return; }
    if (!form.descricao.trim())   { setErro("Descrição é obrigatória."); return; }
    if (!form.categoria)          { setErro("Selecione uma categoria."); return; }
    setSalvando(true); setErro("");

    try {
      const isEditar = modal?.tipo === "editar";
      const url    = isEditar
        ? `/api/projetos/${(modal as { tipo: "editar"; projeto: Projeto }).projeto.id}`
        : "/api/projetos";
      const method = isEditar ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          voluntariosNecessarios: Number(form.voluntariosNecessarios) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      if (isEditar) {
        setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      } else {
        setProjetos((prev) =>
          [...prev, data].sort((a, b) => a.nomeProjeto.localeCompare(b.nomeProjeto, "pt-BR"))
        );
      }
      fechar();
    } catch { setErro("Erro inesperado. Tente novamente.");
    } finally { setSalvando(false); }
  }

  async function excluir() {
    if (modal?.tipo !== "excluir") return;
    setSalvando(true); setErro("");
    try {
      const res = await fetch(`/api/projetos/${modal.projeto.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErro(d.error ?? "Erro ao excluir."); return; }
      setProjetos((prev) => prev.filter((p) => p.id !== modal.projeto.id));
      fechar();
    } catch { setErro("Erro inesperado.");
    } finally { setSalvando(false); }
  }

  if (!pronto) return null;

  const q = busca.toLowerCase();
  const filtrados = q
    ? projetos.filter(
        (p) =>
          p.nomeProjeto.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.entidade.toLowerCase().includes(q) ||
          p.localizacao.toLowerCase().includes(q) ||
          p.nomeResponsavel.toLowerCase().includes(q)
      )
    : projetos;

  const inputClass =
    "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Projetos
          </h1>
          <p className="mt-1 text-base text-[#475569]">Gerencie os projetos sociais cadastrados</p>
        </div>
        <button type="button" onClick={abrirNovo}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] sm:self-auto">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, categoria, entidade ou localização..."
          className="w-full rounded-xl border border-[#bfdbfe] bg-white py-3 pl-11 pr-10 text-[14px] text-[#0f172a] placeholder-[#94a3b8] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15" />
        {busca && (
          <button type="button" onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#94a3b8] hover:text-[#475569]" aria-label="Limpar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
        {carregando ? (
          <div className="flex items-center justify-center py-20 text-[#94a3b8]">
            <svg className="mr-3 h-5 w-5 animate-spin text-[#1d4ed8]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Carregando projetos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1e3a8a]">
              {busca ? "Nenhum projeto encontrado para essa busca" : "Nenhum projeto cadastrado"}
            </p>
            {!busca && <p className="mt-1 text-sm text-[#94a3b8]">Clique em "Novo Projeto" para começar.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Nome</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">Categoria</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] lg:table-cell">Entidade</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] lg:table-cell">Localização</th>
                  <th className="hidden px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">Voluntários</th>
                  <th className="w-24 px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtrados.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-[#f8faff]">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#1e3a8a]">{p.nomeProjeto}</p>
                      {p.descricao && <p className="mt-0.5 line-clamp-1 text-[12px] text-[#94a3b8]">{p.descricao}</p>}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[11px] font-medium text-[#1e40af]">
                        {p.categoria || "—"}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-[#475569] lg:table-cell">{p.entidade || <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className="hidden px-6 py-4 text-[#475569] lg:table-cell">{p.localizacao || <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className="hidden px-6 py-4 text-center text-[#475569] md:table-cell">
                      {p.voluntariosNecessarios > 0 ? p.voluntariosNecessarios : <span className="text-[#cbd5e1]">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => abrirEditar(p)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => abrirExcluir(p)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]" title="Excluir">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                            <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal novo/editar */}
      {(modal?.tipo === "novo" || modal?.tipo === "editar") && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]" style={{ maxHeight: "90vh" }}>
            <h2 className="mb-6 text-[22px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              {modal.tipo === "novo" ? "Novo Projeto" : "Editar Projeto"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome do projeto <span className="text-[#dc2626]">*</span>
                </label>
                <input ref={nomeRef} type="text" value={form.nomeProjeto}
                  onChange={(e) => set("nomeProjeto", e.target.value)}
                  placeholder="Ex: Projeto Ler é Poder" className={inputClass} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Descrição <span className="text-[#dc2626]">*</span>
                </label>
                <textarea value={form.descricao} rows={3}
                  onChange={(e) => set("descricao", e.target.value)}
                  placeholder="Descreva o projeto..." className={`${inputClass} resize-none`} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                    Categoria <span className="text-[#dc2626]">*</span>
                  </label>
                  <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className={inputClass}>
                    <option value="">Selecione...</option>
                    {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Entidade</label>
                  <select value={form.entidadeId} onChange={(e) => set("entidadeId", e.target.value)} className={inputClass}>
                    <option value="">Nenhuma</option>
                    {entidades.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Localização</label>
                  <input type="text" value={form.localizacao}
                    onChange={(e) => set("localizacao", e.target.value)}
                    placeholder="Ex: Pato Branco, PR" className={inputClass} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Voluntários necessários</label>
                  <input type="number" min={0} value={form.voluntariosNecessarios}
                    onChange={(e) => set("voluntariosNecessarios", e.target.value)}
                    placeholder="0" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Nome do responsável</label>
                <input type="text" value={form.nomeResponsavel}
                  onChange={(e) => set("nomeResponsavel", e.target.value)}
                  placeholder="Ex: João da Silva" className={inputClass} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Email</label>
                  <input type="email" value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="contato@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Telefone</label>
                  <input type="tel" value={form.telefone}
                    onChange={(e) => set("telefone", e.target.value)}
                    placeholder="(00) 00000-0000" className={inputClass} />
                </div>
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
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>Salvando...</>
                ) : (modal.tipo === "novo" ? "Cadastrar" : "Salvar")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar exclusão */}
      {modal?.tipo === "excluir" && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-[18px] font-bold text-[#1e3a8a]">Excluir projeto?</h2>
            <p className="text-center text-[14px] text-[#475569]">
              O projeto <span className="font-semibold text-[#1e3a8a]">{modal.projeto.nomeProjeto}</span> será removido permanentemente.
            </p>
            {erro && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>{erro}
              </div>
            )}
            <div className="mt-7 flex justify-center gap-3">
              <button type="button" onClick={fechar} disabled={salvando}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:0.5px]">
                Cancelar
              </button>
              <button type="button" onClick={excluir} disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#dc2626] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-60">
                {salvando ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>Excluindo...</>
                ) : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
