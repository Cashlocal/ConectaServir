"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Entidade = {
  id: string;
  nome: string;
  descricao: string;
  cnpj: string;
  telefoneEntidade: string;
  emailEntidade: string;
  nomePessoaResp: string;
  telefonePessoaResp: string;
  emailPessoaResp: string;
  status: string;
  logo?: string | null;
};

type ModalState =
  | { tipo: "novo" }
  | { tipo: "editar"; entidade: Entidade }
  | { tipo: "excluir"; entidade: Entidade }
  | null;

const inputClass =
  "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pendente: "bg-[#fef9c3] text-[#854d0e] border-[#fde047]",
    Aprovada: "bg-[#dcfce7] text-[#15803d] border-[#86efac]",
  };
  const cls = map[status] ?? "bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold [border-width:0.5px] ${cls}`}>
      {status}
    </span>
  );
}

export default function EntidadesPage() {
  const router = useRouter();
  const [pronto, setPronto]         = useState(false);
  const [entidades, setEntidades]   = useState<Entidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]           = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"" | "Pendente" | "Aprovada">("");
  const [modal, setModal]           = useState<ModalState>(null);
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState("");
  const [aprovando, setAprovando]   = useState<string | null>(null);
  const [expandida, setExpandida]   = useState<string | null>(null);

  const [nome, setNome]                             = useState("");
  const [descricao, setDescricao]                   = useState("");
  const [cnpj, setCnpj]                             = useState("");
  const [telefoneEntidade, setTelefoneEntidade]     = useState("");
  const [emailEntidade, setEmailEntidade]           = useState("");
  const [nomePessoaResp, setNomePessoaResp]         = useState("");
  const [telefonePessoaResp, setTelefonePessoaResp] = useState("");
  const [emailPessoaResp, setEmailPessoaResp]       = useState("");
  const [logoFile, setLogoFile]                     = useState<File | null>(null);
  const [logoPreview, setLogoPreview]               = useState("");
  const [logoAtual, setLogoAtual]                   = useState<string | null>(null);
  const [erroLogo, setErroLogo]                     = useState("");

  const nomeRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!VALID_TYPES.includes(file.type)) { setErroLogo("Formato inválido. Use JPG, PNG ou WEBP."); return; }
    if (file.size > 5 * 1024 * 1024)     { setErroLogo("A imagem deve ter no máximo 5 MB."); return; }
    setErroLogo("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  const [usuarioTipo, setUsuarioTipo] = useState("");
  const [usuarioCnpj, setUsuarioCnpj] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
      const u = JSON.parse(raw);
      setUsuarioTipo(u.tipo ?? "");
      setUsuarioCnpj(u.cnpjEntidade ?? "");
    } catch {
      router.replace("/login"); return;
    }
    setPronto(true);
  }, [router]);

  useEffect(() => { if (!pronto) return; carregarEntidades(); }, [pronto]);
  useEffect(() => { if (modal) setTimeout(() => nomeRef.current?.focus(), 50); }, [modal]);

  async function carregarEntidades() {
    setCarregando(true);
    try {
      const raw  = localStorage.getItem("usuario");
      const u    = raw ? JSON.parse(raw) : {};
      const cnpj = u.cnpjEntidade ?? "";
      const tipo = u.tipo ?? "";
      const url  = tipo === "Entidade" && cnpj
        ? `/api/entidades?cnpjEntidade=${encodeURIComponent(cnpj)}`
        : "/api/entidades";
      const res  = await fetch(url);
      const data = await res.json();
      setEntidades(Array.isArray(data) ? data : []);
    } catch {
      setEntidades([]);
    } finally {
      setCarregando(false);
    }
  }

  function camposVazios() {
    setNome(""); setDescricao(""); setCnpj("");
    setTelefoneEntidade(""); setEmailEntidade("");
    setNomePessoaResp(""); setTelefonePessoaResp(""); setEmailPessoaResp("");
    setLogoFile(null); setLogoPreview(""); setLogoAtual(null); setErroLogo("");
    setErro("");
  }

  function abrirNovo() { camposVazios(); setModal({ tipo: "novo" }); }

  function abrirEditar(e: Entidade) {
    setNome(e.nome); setDescricao(e.descricao); setCnpj(e.cnpj);
    setTelefoneEntidade(e.telefoneEntidade); setEmailEntidade(e.emailEntidade);
    setNomePessoaResp(e.nomePessoaResp); setTelefonePessoaResp(e.telefonePessoaResp);
    setEmailPessoaResp(e.emailPessoaResp);
    setLogoFile(null); setLogoPreview(""); setLogoAtual(e.logo ?? null); setErroLogo("");
    setErro("");
    setModal({ tipo: "editar", entidade: e });
  }

  function abrirExcluir(e: Entidade) { setErro(""); setModal({ tipo: "excluir", entidade: e }); }
  function fechar() { setModal(null); setErro(""); }

  async function salvar() {
    if (!nome.trim()) { setErro("O campo Nome é obrigatório."); return; }
    setSalvando(true); setErro("");

    try {
      let logoUrl: string | undefined;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const upRes  = await fetch("/api/upload-foto", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) { setErro(upData.error ?? "Erro ao enviar o logotipo."); setSalvando(false); return; }
        logoUrl = upData.url;
      }

      const isEditar = modal?.tipo === "editar";
      const url    = isEditar
        ? `/api/entidades/${(modal as { tipo: "editar"; entidade: Entidade }).entidade.id}`
        : "/api/entidades";
      const method = isEditar ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, cnpj, telefoneEntidade, emailEntidade,
                               nomePessoaResp, telefonePessoaResp, emailPessoaResp,
                               ...(logoUrl ? { logoUrl } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      if (isEditar) {
        setEntidades((prev) => prev.map((e) => (e.id === data.id ? data : e)));
      } else {
        setEntidades((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      }
      fechar();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (modal?.tipo !== "excluir") return;
    setSalvando(true); setErro("");
    try {
      const res = await fetch(`/api/entidades/${modal.entidade.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error ?? "Erro ao excluir."); return;
      }
      setEntidades((prev) => prev.filter((e) => e.id !== modal.entidade.id));
      fechar();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function aprovar(ent: Entidade) {
    if (aprovando) return;
    setAprovando(ent.id);
    try {
      const res = await fetch(`/api/entidades/${ent.id}/aprovar`, { method: "POST" });
      if (res.ok) {
        setEntidades((prev) =>
          prev.map((e) => (e.id === ent.id ? { ...e, status: "Aprovada" } : e))
        );
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Erro ao aprovar. Tente novamente.");
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setAprovando(null);
    }
  }

  if (!pronto) return null;

  const q = busca.toLowerCase();
  const filtradas = entidades.filter((e) => {
    const matchBusca =
      !q ||
      e.nome.toLowerCase().includes(q) ||
      e.descricao.toLowerCase().includes(q) ||
      e.nomePessoaResp.toLowerCase().includes(q) ||
      e.emailEntidade.toLowerCase().includes(q);
    const matchStatus = !filtroStatus || e.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Entidades
          </h1>
          <p className="mt-1 text-base text-[#475569]">Gerencie as entidades parceiras do Rotary</p>
        </div>
        {usuarioTipo !== "Entidade" && (
          <button type="button" onClick={abrirNovo}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] sm:self-auto">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Entidade
          </button>
        )}
      </div>

      {/* Busca + Filtro de status */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, responsável ou e-mail..."
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

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as "" | "Pendente" | "Aprovada")}
          className="rounded-xl border border-[#bfdbfe] bg-white px-4 py-3 text-[14px] text-[#0f172a] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15 sm:w-48"
        >
          <option value="">Todos os status</option>
          <option value="Pendente">Pendente</option>
          <option value="Aprovada">Aprovada</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
        {carregando ? (
          <div className="flex items-center justify-center py-20 text-[#94a3b8]">
            <svg className="mr-3 h-5 w-5 animate-spin text-[#1d4ed8]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Carregando entidades...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1e3a8a]">
              {busca || filtroStatus ? "Nenhuma entidade encontrada para esse filtro" : "Nenhuma entidade cadastrada"}
            </p>
            {!busca && !filtroStatus && <p className="mt-1 text-sm text-[#94a3b8]">Clique em "Nova Entidade" para começar.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Nome</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] lg:table-cell">Responsável</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">E-mail Entidade</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Status</th>
                  <th className="px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtradas.map((ent) => (
                  <>
                    {/* ── Linha principal ── */}
                    <tr key={ent.id} className="transition-colors hover:bg-[#f8faff]">
                      {/* Nome + logo + expandir */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Logo ou inicial */}
                          {ent.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ent.logo} alt={ent.nome}
                              className="h-10 w-10 shrink-0 rounded-lg object-contain ring-1 ring-[#bfdbfe]" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#dbeafe] text-[16px] font-bold text-[#1d4ed8]">
                              {ent.nome.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-[#1e3a8a]">{ent.nome}</p>
                            {ent.cnpj && <p className="text-[12px] text-[#94a3b8]">CNPJ: {ent.cnpj}</p>}
                          </div>
                          {/* Botão expandir */}
                          <button
                            type="button"
                            onClick={() => setExpandida((prev) => prev === ent.id ? null : ent.id)}
                            className="ml-1 rounded-md p-1 text-[#94a3b8] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                            title={expandida === ent.id ? "Recolher" : "Expandir detalhes"}
                          >
                            <svg
                              width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              className={`transition-transform duration-200 ${expandida === ent.id ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      <td className="hidden px-6 py-4 text-[#475569] lg:table-cell">
                        {ent.nomePessoaResp || <span className="text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="hidden px-6 py-4 text-[#475569] md:table-cell">
                        {ent.emailEntidade || <span className="text-[#cbd5e1]">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ent.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {usuarioTipo !== "Entidade" && ent.status === "Pendente" && (
                            <button type="button"
                              onClick={() => aprovar(ent)}
                              disabled={aprovando === ent.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#dcfce7] px-2.5 py-1 text-[12px] font-semibold text-[#15803d] transition-colors hover:bg-[#bbf7d0] disabled:opacity-60"
                              title="Aprovar entidade">
                              {aprovando === ent.id ? (
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                              Aprovar
                            </button>
                          )}
                          <button type="button" onClick={() => abrirEditar(ent)}
                            className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                            aria-label={`Editar ${ent.nome}`} title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {usuarioTipo !== "Entidade" && (
                          <button type="button" onClick={() => abrirExcluir(ent)}
                            className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                            aria-label={`Excluir ${ent.nome}`} title="Excluir">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Linha expandida com detalhes ── */}
                    {expandida === ent.id && (
                      <tr key={`${ent.id}-expand`} className="bg-[#f8faff]">
                        <td colSpan={5} className="px-6 pb-5 pt-0">
                          <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border border-[#bfdbfe] bg-white p-5 [border-width:0.5px] sm:grid-cols-2 lg:grid-cols-3">

                            {/* Dados da entidade */}
                            <div>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Dados da Entidade</p>
                              <dl className="space-y-1.5 text-[13px]">
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">Descrição:</dt>
                                  <dd className="text-[#0f172a]">{ent.descricao || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">CNPJ:</dt>
                                  <dd className="text-[#0f172a]">{ent.cnpj || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">Telefone:</dt>
                                  <dd className="text-[#0f172a]">{ent.telefoneEntidade || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">E-mail:</dt>
                                  <dd className="text-[#0f172a]">{ent.emailEntidade || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Pessoa responsável */}
                            <div>
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Pessoa Responsável</p>
                              <dl className="space-y-1.5 text-[13px]">
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">Nome:</dt>
                                  <dd className="text-[#0f172a]">{ent.nomePessoaResp || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">Telefone:</dt>
                                  <dd className="text-[#0f172a]">{ent.telefonePessoaResp || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                                <div className="flex gap-1.5">
                                  <dt className="shrink-0 text-[#94a3b8]">E-mail:</dt>
                                  <dd className="text-[#0f172a]">{ent.emailPessoaResp || <span className="text-[#cbd5e1]">—</span>}</dd>
                                </div>
                              </dl>
                            </div>

                            {/* Logo */}
                            {ent.logo && (
                              <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Logotipo</p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ent.logo} alt={`Logo ${ent.nome}`}
                                  className="h-16 w-auto max-w-[140px] rounded-lg object-contain" />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal novo/editar */}
      {(modal?.tipo === "novo" || modal?.tipo === "editar") && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto p-4 py-8" role="dialog" aria-modal="true">
          <button type="button" className="fixed inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <h2 className="mb-6 text-[22px] font-bold text-[#1e3a8a]" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              {modal.tipo === "novo" ? "Nova Entidade" : "Editar Entidade"}
            </h2>

            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Dados da Entidade</p>
            <div className="space-y-4">
              {/* Logotipo */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Logotipo</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#bfdbfe] bg-[#f8faff] transition-colors hover:border-[#1a44a6]">
                    {(logoPreview || logoAtual) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview || logoAtual!} alt="logo" className="h-full w-full object-contain" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <button type="button" onClick={() => logoRef.current?.click()}
                      className="rounded-lg border border-[#bfdbfe] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1a44a6] hover:bg-[#eff6ff] [border-width:0.5px]">
                      {(logoPreview || logoAtual) ? "Trocar" : "Selecionar"}
                    </button>
                    <p className="mt-0.5 text-[11px] text-[#94a3b8]">JPG, PNG ou WEBP • 5 MB</p>
                    {erroLogo && <p className="text-[11px] text-red-500">{erroLogo}</p>}
                  </div>
                </div>
                <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden" onChange={handleLogoChange} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Nome <span className="text-[#dc2626]">*</span></label>
                <input ref={nomeRef} type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: GAMA" className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Descrição</label>
                <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Casa de apoio" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">CNPJ</label>
                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00" className={inputClass} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Telefone Entidade</label>
                  <input type="tel" value={telefoneEntidade} onChange={(e) => setTelefoneEntidade(e.target.value)}
                    placeholder="(00) 00000-0000" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">E-mail Entidade</label>
                  <input type="email" value={emailEntidade} onChange={(e) => setEmailEntidade(e.target.value)}
                    placeholder="contato@entidade.org" className={inputClass} />
                </div>
              </div>
            </div>

            <p className="mb-3 mt-6 text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Pessoa Responsável</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Nome</label>
                <input type="text" value={nomePessoaResp} onChange={(e) => setNomePessoaResp(e.target.value)}
                  placeholder="Nome completo" className={inputClass} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Telefone</label>
                  <input type="tel" value={telefonePessoaResp} onChange={(e) => setTelefonePessoaResp(e.target.value)}
                    placeholder="(00) 00000-0000" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">E-mail</label>
                  <input type="email" value={emailPessoaResp} onChange={(e) => setEmailPessoaResp(e.target.value)}
                    placeholder="responsavel@email.com" className={inputClass} />
                </div>
              </div>
            </div>

            {erro && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erro}
              </div>
            )}

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
                ) : (modal.tipo === "novo" ? "Criar" : "Salvar")}
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
            <h2 className="mb-2 text-center text-[18px] font-bold text-[#1e3a8a]">Excluir entidade?</h2>
            <p className="text-center text-[14px] text-[#475569]">
              A entidade{" "}
              <span className="font-semibold text-[#1e3a8a]">{modal.entidade.nome}</span>{" "}
              será removida permanentemente.
            </p>
            {erro && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erro}
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
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Excluindo...
                  </>
                ) : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
