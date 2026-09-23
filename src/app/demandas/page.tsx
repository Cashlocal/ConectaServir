"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Demanda = {
  id: string;
  nome: string;
  descricao: string;
  entidadeId: string;
  entidade: string;
  status: "Em Aberto" | "Concluida";
};

type Entidade = { id: string; nome: string };

type ModalState =
  | { tipo: "novo" }
  | { tipo: "editar"; demanda: Demanda }
  | null;

type ModalExcluir = { demanda: Demanda } | null;

export default function DemandasPage() {
  const router = useRouter();
  const [pronto, setPronto]         = useState(false);
  const [demandas, setDemandas]     = useState<Demanda[]>([]);
  const [entidades, setEntidades]   = useState<Entidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]           = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"" | "Em Aberto" | "Concluida">("");
  const [modal, setModal]           = useState<ModalState>(null);
  const [modalExcluir, setModalExcluir] = useState<ModalExcluir>(null);
  const [salvando, setSalvando]     = useState(false);
  const [excluindo, setExcluindo]   = useState(false);
  const [toggling, setToggling]     = useState<string | null>(null);
  const [erro, setErro]             = useState("");

  // Campos do formulário
  const [nome, setNome]             = useState("");
  const [descricao, setDescricao]   = useState("");
  const [entidadeId, setEntidadeId] = useState("");

  const nomeRef = useRef<HTMLInputElement>(null);

  const [usuarioTipo, setUsuarioTipo]             = useState("");
  const [usuarioCnpj, setUsuarioCnpj]             = useState("");
  const [usuarioEntidadeId, setUsuarioEntidadeId] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
      const u = JSON.parse(raw);
      setUsuarioTipo(u.tipo ?? "");
      setUsuarioCnpj(u.cnpjEntidade ?? "");
      setUsuarioEntidadeId(u.entidadeId ?? "");
    } catch {
      router.replace("/login"); return;
    }
    setPronto(true);
  }, [router]);

  useEffect(() => {
    if (pronto) {
      carregarDemandas();
      carregarEntidades();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  useEffect(() => {
    if (modal) setTimeout(() => nomeRef.current?.focus(), 50);
  }, [modal]);

  async function carregarDemandas() {
    setCarregando(true);
    try {
      const cnpj = localStorage.getItem("usuario")
        ? (JSON.parse(localStorage.getItem("usuario")!).cnpjEntidade ?? "")
        : "";
      const tipo = localStorage.getItem("usuario")
        ? (JSON.parse(localStorage.getItem("usuario")!).tipo ?? "")
        : "";
      const url = tipo === "Entidade" && cnpj
        ? `/api/demandas?cnpjEntidade=${encodeURIComponent(cnpj)}`
        : "/api/demandas";
      const res  = await fetch(url);
      const data = await res.json();
      setDemandas(Array.isArray(data) ? data : []);
    } catch {
      setDemandas([]);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarEntidades() {
    try {
      const res  = await fetch("/api/entidades");
      const data = await res.json();
      setEntidades(Array.isArray(data) ? data : []);
    } catch {
      setEntidades([]);
    }
  }

  function abrirNovo() {
    const entId = usuarioTipo === "Entidade" ? usuarioEntidadeId : "";
    setNome(""); setDescricao(""); setEntidadeId(entId); setErro("");
    setModal({ tipo: "novo" });
  }

  function abrirEditar(d: Demanda) {
    setNome(d.nome); setDescricao(d.descricao); setEntidadeId(d.entidadeId); setErro("");
    setModal({ tipo: "editar", demanda: d });
  }

  function fechar() { setModal(null); setModalExcluir(null); setErro(""); }

  async function salvar() {
    if (!nome.trim()) { setErro("O campo Nome é obrigatório."); return; }
    setSalvando(true); setErro("");

    try {
      const isEditar = modal?.tipo === "editar";
      const url      = isEditar
        ? `/api/demandas/${(modal as { tipo: "editar"; demanda: Demanda }).demanda.id}`
        : "/api/demandas";
      const method   = isEditar ? "PATCH" : "POST";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao, entidadeId }),
      });
      const data = await res.json();

      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      if (isEditar) {
        setDemandas((prev) => prev.map((d) => (d.id === data.id ? data : d)));
      } else {
        setDemandas((prev) =>
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

  async function excluir() {
    if (!modalExcluir) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/demandas/${modalExcluir.demanda.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao excluir.");
        setExcluindo(false);
        return;
      }
      setDemandas((prev) => prev.filter((d) => d.id !== modalExcluir.demanda.id));
      fechar();
    } catch {
      setErro("Erro inesperado.");
    } finally {
      setExcluindo(false);
    }
  }

  async function toggleStatus(d: Demanda) {
    const novoStatus = d.status === "Em Aberto" ? "Concluida" : "Em Aberto";
    setToggling(d.id);

    setDemandas((prev) =>
      prev.map((item) => (item.id === d.id ? { ...item, status: novoStatus } : item))
    );

    try {
      const res = await fetch(`/api/demandas/${d.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        setDemandas((prev) =>
          prev.map((item) => (item.id === d.id ? { ...item, status: d.status } : item))
        );
      }
    } catch {
      setDemandas((prev) =>
        prev.map((item) => (item.id === d.id ? { ...item, status: d.status } : item))
      );
    } finally {
      setToggling(null);
    }
  }

  if (!pronto) return null;

  const q = busca.toLowerCase();
  const filtrados = demandas.filter((d) => {
    const matchBusca =
      !q ||
      d.nome.toLowerCase().includes(q) ||
      d.descricao.toLowerCase().includes(q) ||
      d.entidade.toLowerCase().includes(q);
    const matchStatus = !filtroStatus || d.status === filtroStatus;
    return matchBusca && matchStatus;
  });

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
            Demandas
          </h1>
          <p className="mt-1 text-base text-[#475569]">
            Gerencie as demandas cadastradas
          </p>
        </div>
        <button
          type="button"
          onClick={abrirNovo}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] sm:self-auto"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Demanda
        </button>
      </div>

      {/* Busca + Filtro de status */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por demanda, descrição ou instituição..."
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

        {/* Filtro por status */}
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as "" | "Em Aberto" | "Concluida")}
          className="rounded-xl border border-[#bfdbfe] bg-white px-4 py-3 text-[14px] text-[#0f172a] outline-none [border-width:0.5px] focus:border-[#1a44a6] focus:ring-2 focus:ring-[#1a44a6]/15 sm:w-44"
        >
          <option value="">Todos os status</option>
          <option value="Em Aberto">Em Aberto</option>
          <option value="Concluida">Concluída</option>
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
            Carregando demandas...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1e3a8a]">
              {busca || filtroStatus ? "Nenhuma demanda encontrada para esse filtro" : "Nenhuma demanda cadastrada"}
            </p>
            {!busca && !filtroStatus && (
              <p className="mt-1 text-sm text-[#94a3b8]">Clique em "Nova Demanda" para começar.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Demanda</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">Descrição</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Instituição</th>
                  <th className="px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Concluída</th>
                  <th className="w-24 px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtrados.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-[#f8faff]">
                    <td className="px-6 py-4 font-medium text-[#1e3a8a]">{d.nome}</td>
                    <td className="hidden max-w-[260px] truncate px-6 py-4 text-[#475569] md:table-cell">
                      {d.descricao || <span className="text-[#cbd5e1]">—</span>}
                    </td>
                    <td className="px-6 py-4 text-[#475569]">
                      {d.entidade || <span className="text-[#cbd5e1]">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label
                        className="inline-flex cursor-pointer items-center"
                        title={d.status === "Concluida" ? "Clique para reabrir" : "Clique para concluir"}
                      >
                        <input
                          type="checkbox"
                          checked={d.status === "Concluida"}
                          disabled={toggling === d.id}
                          onChange={() => toggleStatus(d)}
                          className="sr-only"
                        />
                        <span
                          className={`relative inline-block h-5 w-9 rounded-full transition-colors duration-200
                            ${toggling === d.id ? "opacity-50" : ""}
                            ${d.status === "Concluida" ? "bg-[#16a34a]" : "bg-[#cbd5e1]"}`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200
                              ${d.status === "Concluida" ? "translate-x-[18px]" : "translate-x-0.5"}`}
                          />
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(d)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                          aria-label={`Editar ${d.nome}`}
                          title="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setErro(""); setModalExcluir({ demanda: d }); }}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Excluir ${d.nome}`}
                          title="Excluir"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
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

      {/* Modal criar / editar */}
      {modal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <h2
              className="mb-6 text-[22px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {modal.tipo === "novo" ? "Nova Demanda" : "Editar Demanda"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  ref={nomeRef}
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cesta Básica"
                  className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes da demanda..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Instituição</label>
                <select
                  value={entidadeId}
                  onChange={(e) => setEntidadeId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione uma instituição...</option>
                  {entidades.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome}</option>
                  ))}
                </select>
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

      {/* Modal confirmar exclusão */}
      {modalExcluir && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <h2 className="mb-2 text-[20px] font-bold text-[#1e3a8a]">Excluir demanda?</h2>
            <p className="mb-6 text-[14px] text-[#475569]">
              A demanda <strong className="text-[#1e3a8a]">{modalExcluir.demanda.nome}</strong> será
              excluída permanentemente. Essa ação não pode ser desfeita.
            </p>
            {erro && (
              <p className="mb-4 text-sm text-red-600">{erro}</p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={fechar} disabled={excluindo}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:0.5px]">
                Cancelar
              </button>
              <button type="button" onClick={excluir} disabled={excluindo}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60">
                {excluindo ? (
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
