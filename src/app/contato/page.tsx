"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-2xl border border-[#e8edf5] bg-[#f8faff] px-5 py-3.5 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

export default function ContatoPage() {
  const [nome, setNome]         = useState("");
  const [email, setEmail]       = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso]   = useState(false);
  const [erro, setErro]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro("Informe o seu nome."); return; }
    if (!email.trim()) { setErro("Informe o seu e-mail."); return; }
    if (!mensagem.trim()) { setErro("Escreva a sua mensagem."); return; }
    setErro("");
    setSalvando(true);
    try {
      const res  = await fetch("/api/contato", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ nome, email, mensagem }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }
      setSucesso(true);
      setNome(""); setEmail(""); setMensagem("");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-180px)] bg-[#f8faff] px-6 py-16 md:px-16">
      <div className="mx-auto max-w-[860px]">
        <h1
          className="mb-8 flex items-center gap-3 text-[32px] font-bold text-[#0f172a] md:text-[36px]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          <span className="inline-block h-8 w-[3px] rounded-full bg-[#0f172a]" aria-hidden />
          Fale conosco
        </h1>

        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] bg-white p-6 shadow-[0_8px_40px_rgba(15,23,42,0.06)] md:p-10"
        >
          {sucesso ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-[20px] font-semibold text-[#166534]">Mensagem enviada!</p>
              <p className="mt-2 max-w-sm text-[14px] text-[#475569]">
                Obrigado pelo contato. Em breve retornaremos no e-mail informado.
              </p>
              <button
                type="button"
                onClick={() => setSucesso(false)}
                className="mt-6 text-[14px] font-medium text-[#1a44a6] hover:underline"
              >
                Enviar outra mensagem
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  className={inputClass}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Mensagem"
                rows={6}
                className={`${inputClass} mt-4 resize-y`}
              />

              {erro && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={salvando}
                className="mt-6 w-full rounded-full bg-gradient-to-r from-[#0b1220] to-[#2563eb] py-3.5 text-[14px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {salvando ? "Enviando..." : "Enviar"}
              </button>
            </>
          )}
        </form>
      </div>
    </main>
  );
}
