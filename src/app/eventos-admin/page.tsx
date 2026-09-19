"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Evento = {
  id: string;
  nome: string;
  descricao: string;
  data: string | null;
  banner: string | null;
};

type ModalState =
  | { tipo: "novo" }
  | { tipo: "editar"; evento: Evento }
  | { tipo: "excluir"; evento: Evento }
  | null;

function formatarDataHora(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function isoParaDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function datetimeLocalParaIso(local: string): string {
  if (!local) return "";
  return new Date(local + ":00.000Z").toISOString();
}

export default function EventosAdminPage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataLocal, setDataLocal] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

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
    if (pronto) carregarEventos();
  }, [pronto]);

  useEffect(() => {
    if (modal && modal.tipo !== "excluir") {
      setTimeout(() => nomeRef.current?.focus(), 50);
    }
  }, [modal]);

  async function carregarEventos() {
    setCarregando(true);
    try {
      const res = await fetch("/api/eventos");
      const data = await res.json();
      const list: Evento[] = Array.isArray(data.records) ? data.records : [];
      list.sort((a, b) => {
        if (!a.data) return 1;
        if (!b.data) return -1;
        return new Date(a.data).getTime() - new Date(b.data).getTime();
      });
      setEventos(list);
    } catch {
      setEventos([]);
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setNome(""); setDescricao(""); setDataLocal(""); setBannerUrl(""); setBannerFile(null); setBannerPreview(""); setErro("");
    setModal({ tipo: "novo" });
  }

  function abrirEditar(ev: Evento) {
    setNome(ev.nome);
    setDescricao(ev.descricao);
    setDataLocal(isoParaDatetimeLocal(ev.data));
    setBannerUrl(ev.banner ?? "");
    setBannerFile(null);
    setBannerPreview(ev.banner ?? "");
    setErro("");
    setModal({ tipo: "editar", evento: ev });
  }

  function abrirExcluir(ev: Evento) {
    setErro("");
    setModal({ tipo: "excluir", evento: ev });
  }

  function fechar() { setModal(null); setErro(""); setBannerFile(null); setBannerPreview(""); }

  async function salvar() {
    if (!nome.trim()) { setErro("O campo Nome Evento é obrigatório."); return; }
    setSalvando(true); setErro("");

    try {
      const isEditar = modal?.tipo === "editar";
      const eventoId = isEditar ? (modal as { tipo: "editar"; evento: Evento }).evento.id : null;
      const url = isEditar ? `/api/eventos/${eventoId}` : "/api/eventos";
      const method = isEditar ? "PATCH" : "POST";

      let finalBannerUrl = bannerUrl;

      if (bannerFile) {
        const fd = new FormData();
        fd.append("file", bannerFile);
        const uploadRes = await fetch("/api/upload-banner", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) { setErro(uploadData.error ?? "Erro ao fazer upload da imagem."); return; }
        finalBannerUrl = uploadData.url;
      }

      const body: Record<string, string> = { nome: nome.trim(), descricao: descricao.trim() };
      if (dataLocal) body.data = datetimeLocalParaIso(dataLocal);
      if (finalBannerUrl.trim()) body.bannerUrl = finalBannerUrl.trim();
      else if (isEditar) body.bannerUrl = "";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      if (isEditar) {
        setEventos((prev) =>
          prev
            .map((e) => (e.id === data.id ? data : e))
            .sort((a, b) => {
              if (!a.data) return 1;
              if (!b.data) return -1;
              return new Date(a.data).getTime() - new Date(b.data).getTime();
            })
        );
      } else {
        setEventos((prev) =>
          [...prev, data].sort((a, b) => {
            if (!a.data) return 1;
            if (!b.data) return -1;
            return new Date(a.data).getTime() - new Date(b.data).getTime();
          })
        );
      }
      fechar();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (modal?.tipo !== "excluir") return;
    setExcluindo(true); setErro("");
    const id = modal.evento.id;

    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao excluir."); return;
      }
      setEventos((prev) => prev.filter((e) => e.id !== id));
      fechar();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setExcluindo(false);
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
            Eventos
          </h1>
          <p className="mt-1 text-base text-[#475569]">
            Gerencie os eventos cadastrados
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
          Novo Evento
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
        {carregando ? (
          <div className="flex items-center justify-center py-20 text-[#94a3b8]">
            <svg className="mr-3 h-5 w-5 animate-spin text-[#1d4ed8]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Carregando eventos...
          </div>
        ) : eventos.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-[15px] font-medium text-[#1e3a8a]">Nenhum evento cadastrado</p>
            <p className="mt-1 text-sm text-[#94a3b8]">Clique em &quot;Novo Evento&quot; para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Nome</th>
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Data/Hora</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">Descrição</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] sm:table-cell">Banner</th>
                  <th className="w-28 px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {eventos.map((ev) => (
                  <tr key={ev.id} className="transition-colors hover:bg-[#f8faff]">
                    <td className="px-6 py-4 font-medium text-[#1e3a8a]">{ev.nome}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-[#475569]">{formatarDataHora(ev.data)}</td>
                    <td className="hidden max-w-[320px] px-6 py-4 text-[#475569] md:table-cell">
                      <span className="line-clamp-2">{ev.descricao || <span className="text-[#cbd5e1]">—</span>}</span>
                    </td>
                    <td className="hidden px-6 py-4 sm:table-cell">
                      {ev.banner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ev.banner} alt={ev.nome} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <span className="text-[#cbd5e1]">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(ev)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                          aria-label={`Editar ${ev.nome}`}
                          title="Editar"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirExcluir(ev)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                          aria-label={`Excluir ${ev.nome}`}
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
      {modal && modal.tipo !== "excluir" && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <h2
              className="mb-6 text-[22px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              {modal.tipo === "novo" ? "Novo Evento" : "Editar Evento"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome Evento <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  ref={nomeRef}
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Reunião Ordinária"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={dataLocal}
                  onChange={(e) => setDataLocal(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Descrição</label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes do evento..."
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Banner do Evento</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setBannerFile(file);
                    if (file) {
                      setBannerPreview(URL.createObjectURL(file));
                    }
                  }}
                  className={`${inputClass} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#dbeafe] file:px-3 file:py-1 file:text-[13px] file:font-medium file:text-[#1d4ed8]`}
                />
                {bannerPreview && (
                  <div className="relative mt-2 inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerPreview}
                      alt="Pré-visualização do banner"
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerPreview(""); setBannerUrl(""); }}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                      title="Remover banner"
                      aria-label="Remover banner"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
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

      {/* Modal de confirmação de exclusão */}
      {modal?.tipo === "excluir" && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="mb-2 text-center text-[20px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Excluir Evento
            </h2>
            <p className="mb-6 text-center text-[14px] text-[#475569]">
              Tem certeza que deseja excluir <strong className="text-[#1e3a8a]">{modal.evento.nome}</strong>? Esta ação não pode ser desfeita.
            </p>

            {erro && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erro}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={fechar} disabled={excluindo}
                className="rounded-xl border border-[#e2e8f0] px-5 py-2.5 text-[14px] font-medium text-[#475569] transition-colors hover:bg-[#f8faff] [border-width:0.5px]">
                Cancelar
              </button>
              <button type="button" onClick={confirmarExclusao} disabled={excluindo}
                className="inline-flex items-center gap-2 rounded-xl bg-[#dc2626] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-60">
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
