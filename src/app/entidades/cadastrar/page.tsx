"use client";

import Link from "next/link";
import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

export default function CadastrarEntidadePage() {
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [nome, setNome]                       = useState("");
  const [descricao, setDescricao]             = useState("");
  const [cnpj, setCnpj]                       = useState("");
  const [telefoneEntidade, setTelefoneEntidade] = useState("");
  const [emailEntidade, setEmailEntidade]     = useState("");
  const [nomePessoaResp, setNomePessoaResp]   = useState("");
  const [telefonePessoaResp, setTelefonePessoaResp] = useState("");
  const [emailPessoaResp, setEmailPessoaResp] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { setErro("O campo Nome da Entidade é obrigatório."); return; }
    setErro("");
    setSalvando(true);
    try {
      const res = await fetch("/api/entidades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, descricao, cnpj,
          telefoneEntidade, emailEntidade,
          nomePessoaResp, telefonePessoaResp, emailPessoaResp,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErro(data.error ?? "Ocorreu um erro. Tente novamente.");
        return;
      }
      setSucesso(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (sucesso) {
    return (
      <main className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-[#eff6ff] px-4 py-12">
        <div className="w-full max-w-[520px] rounded-2xl border border-[#bbf7d0] bg-white p-10 text-center shadow-[0_4px_24px_rgba(22,163,74,0.08)] [border-width:0.5px]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#dcfce7]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#15803d]" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Cadastro realizado com sucesso!
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#475569]">
            Obrigado pelo interesse em fazer parte da nossa rede.
            Seu cadastro passará pelo processo de análise e em breve entraremos em contato.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#1a44a6] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#153575]"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-4 py-12 md:px-16">
      <div className="mx-auto max-w-[680px]">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a44a6] shadow-[0_4px_16px_rgba(26,68,166,0.25)]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#1e3a8a]" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Cadastrar minha entidade
          </h1>
          <p className="mt-2 text-sm text-[#64748b]">
            Preencha os dados abaixo para solicitar o cadastro da sua entidade no ConectaServir
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Dados da Entidade */}
          <div className="rounded-2xl border border-[#bfdbfe] bg-white p-6 shadow-[0_2px_12px_rgba(29,78,216,0.06)] [border-width:0.5px]">
            <h2 className="mb-5 text-[17px] font-bold text-[#1e3a8a]">Dados da Entidade</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Nome da Entidade <span className="text-[#dc2626]">*</span>
                </label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: GAMA — Casa de Apoio" className={inputClass} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Descrição</label>
                <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva brevemente a missão e atuação da entidade..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">CNPJ</label>
                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00" className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Telefone da Entidade</label>
                  <input type="tel" value={telefoneEntidade} onChange={(e) => setTelefoneEntidade(e.target.value)}
                    placeholder="(00) 00000-0000" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">E-mail da Entidade</label>
                  <input type="email" value={emailEntidade} onChange={(e) => setEmailEntidade(e.target.value)}
                    placeholder="contato@entidade.org" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

          {/* Pessoa Responsável */}
          <div className="rounded-2xl border border-[#bfdbfe] bg-white p-6 shadow-[0_2px_12px_rgba(29,78,216,0.06)] [border-width:0.5px]">
            <h2 className="mb-5 text-[17px] font-bold text-[#1e3a8a]">Pessoa Responsável</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">Nome da Pessoa Responsável</label>
                <input type="text" value={nomePessoaResp} onChange={(e) => setNomePessoaResp(e.target.value)}
                  placeholder="Nome completo" className={inputClass} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          {erro && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {erro}
            </div>
          )}

          <button type="submit" disabled={salvando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a44a6] px-6 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#153575] disabled:cursor-not-allowed disabled:opacity-50">
            {salvando ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Enviando...
              </>
            ) : "Enviar cadastro"}
          </button>
        </form>
      </div>
    </main>
  );
}
