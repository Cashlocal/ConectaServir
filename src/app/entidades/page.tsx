"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Entidade = { id: string; nome: string; descricao: string };

type ModalState =
  | { tipo: "novo" }
  | { tipo: "editar"; entidade: Entidade }
  | { tipo: "excluir"; entidade: Entidade }
  | null;

export default function EntidadesPage() {
  const router = useRouter();
  const [pronto, setPronto]       = useState(false);
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal]         = useState<ModalState>(null);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState("");

  const [nome, setNome]           = useState("");
  const [descricao, setDescricao] = useState("");

  const nomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
    } catch {
      router.replace("/login"); return;
    }
    setPronto(true);
  }, [router]);

  useEffect(() => {
    if (!pronto) return;
    carregarEntidades();
  }, [pronto]);

  useEffect(() => {
    if (modal) setTimeout(() => nomeRef.current?.focus(), 50);
  }, [modal]);

  async function carregarEntidades() {
    setCarregando(true);
    try {
      const res = await fetch("/api/entidades");
      const data = await res.json();
      setEntidades(Array.isArray(data) ? data : []);
    } catch {
      setEntidades([]);
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setNome(""); setDescricao(""); setErro("");
    setModal({ tipo: "novo" });
  }

  function abrirEditar(e: Entidade) {
    setNome(e.nome); setDescricao(e.descricao); setErro("");
    setModal({ tipo: "editar", entidade: e });
  }

  function abrirExcluir(e: Entidade) {
    setErro("");
    setModal({ tipo: "excluir", entidade: e });
  }

  function fechar() { setModal(null); setErro(""); }

  async function salvar() {
    if (!nome.trim()) { setErro("O campo Nome é obrigatório."); return; }
    setSalvando(true); setErro("");

    try {
      const isEditar = modal?.tipo === "editar";
      const url = isEditar ? `/api/entidades/${(modal as { tipo: "editar"; entidade: Entidade }).entidade.id}` : "/api/entidades";
      const method = isEditar ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, descricao }),
      });
      const data = await res.json();

      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      if (isEditar) {
        setEntidades((prev) =>
          prev.map((e) => (e.id === data.id ? data : e))
        );
      } else {
        setEntidades((prev) =>
          [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome))
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

  if (!pronto) return null;

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
            Entidades
          </h1>
          <p className="mt-1 text-base text-[#475569]">
            Gerencie as entidades parceiras do Rotary
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
          Nova Entidade
        </button>
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
        ) : entidades.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1e3a8a]">Nenhuma entidade cadastrada</p>
            <p className="mt-1 text-sm text-[#94a3b8]">Clique em "Nova Entidade" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Nome</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Descrição</th>
                  <th className="w-28 px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {entidades.map((ent) => (
                  <tr key={ent.id} className="transition-colors hover:bg-[#f8faff]">
                    <td className="px-6 py-4 font-medium text-[#1e3a8a]">{ent.nome}</td>
                    <td className="px-6 py-4 text-[#475569]">{ent.descricao || <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => abrirEditar(ent)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                          aria-label={`Editar ${ent.nome}`}
                          title="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirExcluir(ent)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                          aria-label={`Excluir ${ent.nome}`}
                          title="Excluir"
                        >
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
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={fechar}
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <h2
              className="mb-6 text-[22px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {modal.tipo === "novo" ? "Nova Entidade" : "Editar Entidade"}
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  ref={nomeRef}
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: GAMA"
                  className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Casa de apoio"
                  className={inputClass}
                  onKeyDown={(e) => { if (e.key === "Enter") salvar(); }}
                />
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
              <button
                type="button"
                onClick={fechar}
                disabled={salvando}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:0.5px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-60"
              >
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
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={fechar}
            aria-label="Fechar"
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-[18px] font-bold text-[#1e3a8a]">
              Excluir entidade?
            </h2>
            <p className="text-center text-[14px] text-[#475569]">
              A entidade{" "}
              <span className="font-semibold text-[#1e3a8a]">{modal.entidade.nome}</span>{" "}
              será removida permanentemente. Esta ação não pode ser desfeita.
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
              <button
                type="button"
                onClick={fechar}
                disabled={salvando}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:0.5px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={excluir}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-[#dc2626] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-60"
              >
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
