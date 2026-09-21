"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UsuarioLocal = { id: string; nome: string; email: string; foto?: string | null };

export default function PerfilPage() {
  const router = useRouter();

  const [pronto,   setPronto]   = useState(false);
  const [userId,   setUserId]   = useState("");
  const [nome,     setNome]     = useState("");
  const [email,    setEmail]    = useState("");
  const [clube,    setClube]    = useState("");
  const [senhaAtual,    setSenhaAtual]    = useState("");
  const [novaSenha,     setNovaSenha]     = useState("");
  const [confirmarSenha,setConfirmarSenha]= useState("");
  const [fotoAtual,  setFotoAtual]  = useState<string | null>(null);
  const [fotoFile,   setFotoFile]   = useState<File | null>(null);
  const [fotoPreview,setFotoPreview]= useState("");
  const [salvando,   setSalvando]   = useState(false);
  const [sucesso,    setSucesso]    = useState("");
  const [erro,       setErro]       = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
      const u: UsuarioLocal = JSON.parse(raw);
      setUserId(u.id);
      setNome(u.nome ?? "");
      setEmail(u.email ?? "");
      setFotoAtual(u.foto ?? null);

      // Busca dados completos do servidor
      fetch("/api/usuarios")
        .then((r) => r.json())
        .then((lista) => {
          const found = Array.isArray(lista) ? lista.find((x: { id: string }) => x.id === u.id) : null;
          if (found) {
            setNome(found.nome ?? "");
            setEmail(found.email ?? "");
            setClube(found.clube ?? "");
            setFotoAtual(found.foto ?? null);
          }
        })
        .catch(() => {});

      setPronto(true);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  if (!pronto) return null;

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(""); setSucesso("");

    if (!nome.trim())  { setErro("Nome é obrigatório.");  return; }
    if (!email.trim()) { setErro("Email é obrigatório."); return; }

    if (novaSenha || confirmarSenha) {
      if (novaSenha.length < 4) { setErro("A nova senha deve ter ao menos 4 caracteres."); return; }
      if (novaSenha !== confirmarSenha) { setErro("As senhas não coincidem."); return; }
    }

    setSalvando(true);
    try {
      let finalFotoUrl: string | undefined = undefined;

      if (fotoFile) {
        const fd = new FormData();
        fd.append("file", fotoFile);
        const upRes  = await fetch("/api/upload-foto", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) { setErro(upData.error ?? "Erro ao enviar a foto."); return; }
        finalFotoUrl = upData.url;
      }

      const body: Record<string, unknown> = { nome, email, clube };
      if (novaSenha)                body.senha   = novaSenha;
      if (finalFotoUrl !== undefined) body.fotoUrl = finalFotoUrl;

      const res  = await fetch(`/api/usuarios/${userId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.error ?? "Erro ao salvar."); return; }

      // Atualiza localStorage e dispara evento para o Navbar
      const fotoFinal = finalFotoUrl ?? fotoAtual;
      const updated: UsuarioLocal = { id: userId, nome: data.nome, email: data.email, foto: fotoFinal };
      localStorage.setItem("usuario", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("usuario-autenticado", { detail: updated }));

      if (finalFotoUrl) { setFotoAtual(finalFotoUrl); setFotoFile(null); setFotoPreview(""); }
      setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      setSucesso("Perfil atualizado com sucesso!");
      setTimeout(() => setSucesso(""), 4000);
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  const fotoSrc = fotoPreview || fotoAtual;
  const inputClass = "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-4 py-12">
      <div className="mx-auto w-full max-w-[480px]">
        <div className="rounded-2xl border border-[#bfdbfe] bg-white p-8 shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">

          {/* Avatar + botão de foto */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="relative">
              {fotoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoSrc} alt={nome}
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-[#bfdbfe]" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1d4ed8] text-4xl font-bold text-white ring-4 ring-[#bfdbfe]">
                  {nome.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1d4ed8] text-white shadow hover:bg-[#1e40af]"
                title="Alterar foto">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            <p className="text-[12px] text-[#94a3b8]">Clique na câmera para alterar a foto</p>
          </div>

          <h1 className="mb-6 text-center text-[24px] font-bold text-[#1e3a8a]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Meu Perfil
          </h1>

          <form onSubmit={salvar} noValidate className="space-y-5">

            {/* Dados pessoais */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                Nome <span className="text-[#dc2626]">*</span>
              </label>
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo" className={inputClass} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                Email <span className="text-[#dc2626]">*</span>
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" className={inputClass} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Clube</label>
              <input type="text" value={clube} onChange={(e) => setClube(e.target.value)}
                placeholder="Ex: Rotary Club de Pato Branco" className={inputClass} />
            </div>

            {/* Separador */}
            <div className="pt-2" style={{ borderTop: "0.5px solid #e2e8f0" }} />

            <p className="text-[13px] font-semibold text-[#1e3a8a]">Alterar senha</p>
            <p className="!mt-0.5 text-[12px] text-[#94a3b8]">Deixe em branco para manter a senha atual.</p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Nova senha</label>
              <div className="relative">
                <input type={mostrarSenha ? "text" : "password"} value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••" className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8] hover:text-[#475569]" aria-label="Mostrar/ocultar">
                  {mostrarSenha ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Confirmar nova senha</label>
              <input type={mostrarSenha ? "text" : "password"} value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••" className={inputClass} />
            </div>

            {/* Feedback */}
            {erro && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 [border-width:0.5px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {sucesso}
              </div>
            )}

            <button type="submit" disabled={salvando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1d4ed8] px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:opacity-60">
              {salvando ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>Salvando...</>
              ) : "Salvar alterações"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
