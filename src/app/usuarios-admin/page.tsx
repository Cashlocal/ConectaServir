"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  clube: string;
  status: "Ativo" | "Inativo";
  foto: string | null;
};

type ModalState =
  | { tipo: "editar"; usuario: Usuario }
  | { tipo: "excluir"; usuario: Usuario }
  | null;

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [pronto, setPronto]         = useState(false);
  const [usuarios, setUsuarios]     = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]           = useState("");
  const [modal, setModal]           = useState<ModalState>(null);
  const [salvando, setSalvando]     = useState(false);
  const [toggling, setToggling]     = useState<string | null>(null);
  const [erro, setErro]             = useState("");

  const [nome, setNome]   = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [clube, setClube] = useState("");
  const [fotoFile, setFotoFile]       = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoAtual, setFotoAtual]     = useState<string | null>(null);

  const nomeRef    = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
    } catch { router.replace("/login"); return; }
    setPronto(true);
  }, [router]);

  useEffect(() => { if (pronto) carregarUsuarios(); }, [pronto]);
  useEffect(() => { if (modal) setTimeout(() => nomeRef.current?.focus(), 50); }, [modal]);

  async function carregarUsuarios() {
    setCarregando(true);
    try {
      const res  = await fetch("/api/usuarios");
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch { setUsuarios([]); }
    finally { setCarregando(false); }
  }

  function abrirEditar(u: Usuario) {
    setNome(u.nome); setEmail(u.email); setSenha(u.senha);
    setClube(u.clube); setFotoAtual(u.foto);
    setFotoFile(null); setFotoPreview(""); setErro("");
    setModal({ tipo: "editar", usuario: u });
  }

  function abrirExcluir(u: Usuario) {
    setErro(""); setModal({ tipo: "excluir", usuario: u });
  }

  function fechar() { setModal(null); setErro(""); setFotoFile(null); setFotoPreview(""); }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function salvar() {
    if (!nome.trim())  { setErro("Nome é obrigatório."); return; }
    if (!email.trim()) { setErro("Email é obrigatório."); return; }
    if (modal?.tipo !== "editar") return;
    setSalvando(true); setErro("");

    try {
      let finalFotoUrl: string | undefined = undefined;

      if (fotoFile) {
        const fd = new FormData();
        fd.append("file", fotoFile);
        const uploadRes  = await fetch("/api/upload-foto", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) { setErro(uploadData.error ?? "Erro ao fazer upload da foto."); return; }
        finalFotoUrl = uploadData.url;
      }

      const isNovo = modal.usuario.id === "__novo__";

      if (isNovo) {
        const body: Record<string, unknown> = { nome, email, senha, clube };
        if (finalFotoUrl !== undefined) body.fotoUrl = finalFotoUrl;

        const res  = await fetch("/api/usuarios", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setErro(data.error ?? "Erro ao criar usuário."); return; }

        setUsuarios((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
        fechar();
        return;
      }

      const body: Record<string, unknown> = { nome, email, senha, clube };
      if (finalFotoUrl !== undefined) body.fotoUrl = finalFotoUrl;

      const res  = await fetch(`/api/usuarios/${modal.usuario.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      setUsuarios((prev) => prev.map((u) => (u.id === data.id ? data : u)));

      // Atualiza localStorage se for o usuário logado
      try {
        const raw = localStorage.getItem("usuario");
        if (raw) {
          const logado = JSON.parse(raw);
          if (logado.id === data.id) {
            const updated = { ...logado, nome: data.nome, email: data.email, foto: data.foto };
            localStorage.setItem("usuario", JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent("usuario-autenticado", { detail: updated }));
          }
        }
      } catch {}

      fechar();
    } catch { setErro("Erro inesperado. Tente novamente.");
    } finally { setSalvando(false); }
  }

  async function excluir() {
    if (modal?.tipo !== "excluir") return;
    setSalvando(true); setErro("");
    try {
      const res = await fetch(`/api/usuarios/${modal.usuario.id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setErro(d.error ?? "Erro ao excluir."); return; }
      setUsuarios((prev) => prev.filter((u) => u.id !== modal.usuario.id));
      fechar();
    } catch { setErro("Erro inesperado.");
    } finally { setSalvando(false); }
  }

  async function toggleStatus(u: Usuario) {
    const novoStatus = u.status === "Ativo" ? "Inativo" : "Ativo";
    setToggling(u.id);
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: novoStatus } : x)));
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) {
        setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: u.status } : x)));
      }
    } catch {
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: u.status } : x)));
    } finally { setToggling(null); }
  }

  if (!pronto) return null;

  const q = busca.toLowerCase();
  const filtrados = q
    ? usuarios.filter(
        (u) =>
          u.nome.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.clube.toLowerCase().includes(q)
      )
    : usuarios;

  const inputClass =
    "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

  const fotoSrc = fotoPreview || fotoAtual;

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Usuários
          </h1>
          <p className="mt-1 text-base text-[#475569]">Gerencie os usuários do sistema</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNome(""); setEmail(""); setSenha(""); setClube("");
            setFotoAtual(null); setFotoFile(null); setFotoPreview(""); setErro("");
            setModal({ tipo: "editar", usuario: { id: "__novo__", nome: "", email: "", senha: "", clube: "", status: "Ativo", foto: null } });
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, email ou clube..."
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
            Carregando usuários...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[15px] font-medium text-[#1e3a8a]">
              {busca ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8faff]">
                  <th className="px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Usuário</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] md:table-cell">Email</th>
                  <th className="hidden px-6 py-3.5 text-left text-[12px] font-semibold uppercase tracking-wide text-[#64748b] lg:table-cell">Clube</th>
                  <th className="px-6 py-3.5 text-center text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ativo</th>
                  <th className="w-24 px-6 py-3.5 text-right text-[12px] font-semibold uppercase tracking-wide text-[#64748b]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtrados.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[#f8faff]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.foto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.foto} alt={u.nome}
                            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[#bfdbfe]" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-[14px] font-bold text-white">
                            {u.nome.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="font-medium text-[#1e3a8a]">{u.nome}</span>
                      </div>
                    </td>
                    <td className="hidden px-6 py-3.5 text-[#475569] md:table-cell">{u.email || <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className="hidden px-6 py-3.5 text-[#475569] lg:table-cell">{u.clube || <span className="text-[#cbd5e1]">—</span>}</td>
                    <td className="px-6 py-3.5 text-center">
                      <label className="inline-flex cursor-pointer items-center" title={u.status === "Ativo" ? "Clique para inativar" : "Clique para ativar"}>
                        <input type="checkbox" checked={u.status === "Ativo"} disabled={toggling === u.id}
                          onChange={() => toggleStatus(u)} className="sr-only" />
                        <span className={`relative inline-block h-5 w-9 rounded-full transition-colors duration-200 ${toggling === u.id ? "opacity-50" : ""} ${u.status === "Ativo" ? "bg-[#1d4ed8]" : "bg-[#cbd5e1]"}`}>
                          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${u.status === "Ativo" ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button type="button" onClick={() => abrirEditar(u)}
                          className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#eff6ff] hover:text-[#1d4ed8]" title="Editar">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button type="button" onClick={() => abrirExcluir(u)}
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

      {/* Modal editar */}
      {modal?.tipo === "editar" && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={fechar} aria-label="Fechar" />
          <div className="relative w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-[0_8px_40px_rgba(29,78,216,0.15)]" style={{ maxHeight: "90vh" }}>
            <h2 className="mb-6 text-[22px] font-bold text-[#1e3a8a]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              {modal.usuario.id === "__novo__" ? "Novo Usuário" : "Editar Usuário"}
            </h2>

            {/* Foto */}
            <div className="mb-5 flex flex-col items-center gap-3">
              <div className="relative">
                {fotoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoSrc} alt="Foto"
                    className="h-20 w-20 rounded-full object-cover ring-4 ring-[#bfdbfe]" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1d4ed8] text-2xl font-bold text-white ring-4 ring-[#bfdbfe]">
                    {nome.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1d4ed8] text-white shadow-sm hover:bg-[#1e40af]"
                  title="Alterar foto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={handleFotoChange} />
              <p className="text-[11px] text-[#94a3b8]">Clique na câmera para alterar a foto</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome <span className="text-[#dc2626]">*</span>
                </label>
                <input ref={nomeRef} type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Email <span className="text-[#dc2626]">*</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Senha</label>
                <input type="text" value={senha} onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha de acesso" className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Clube</label>
                <input type="text" value={clube} onChange={(e) => setClube(e.target.value)}
                  placeholder="Ex: Rotary Club de Pato Branco" className={inputClass} />
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
                ) : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal excluir */}
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
            <h2 className="mb-2 text-center text-[18px] font-bold text-[#1e3a8a]">Excluir usuário?</h2>
            <p className="text-center text-[14px] text-[#475569]">
              O usuário <span className="font-semibold text-[#1e3a8a]">{modal.usuario.nome}</span> será removido permanentemente.
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
