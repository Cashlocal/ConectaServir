"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Certificado = {
  id: string;
  voluntario: string;
  qtdeHoras: number;
  atividade: string;
  status: string;
  arquivoUrl: string | null;
};

export default function GerarCertificadoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [pronto, setPronto] = useState(false);
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [gerando, setGerando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  // Proteção de rota
  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (!raw) { router.replace("/login"); return; }
    } catch {
      router.replace("/login"); return;
    }
    setPronto(true);
  }, [router]);

  // Buscar dados do certificado
  useEffect(() => {
    if (!pronto || !id) return;
    (async () => {
      try {
        const res = await fetch("/api/certificados");
        const data = await res.json();
        const found = Array.isArray(data) ? data.find((c: Certificado) => c.id === id) : null;
        if (!found) { setNaoEncontrado(true); return; }
        setCertificado(found);
      } catch {
        setNaoEncontrado(true);
      } finally {
        setCarregando(false);
      }
    })();
  }, [pronto, id]);

  async function handleGerar() {
    setErro("");
    setGerando(true);
    try {
      const res = await fetch(`/api/certificados/${id}/gerar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErro(data.error ?? "Ocorreu um erro. Tente novamente.");
        return;
      }
      setSucesso(true);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  if (!pronto) return null;

  return (
    <main className="flex min-h-[calc(100vh-120px)] items-start justify-center bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      <div className="w-full max-w-[560px]">
        <Link
          href="/certificados"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-[#475569] transition-colors hover:text-[#1d4ed8]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Voltar para certificados
        </Link>

        <h1
          className="mb-8 text-[40px] font-bold leading-tight text-[#1e3a8a]"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Gerar Certificado
        </h1>

        {/* Loading */}
        {carregando && (
          <div className="h-64 animate-pulse rounded-2xl bg-[#dbeafe] opacity-60" />
        )}

        {/* Não encontrado */}
        {!carregando && naoEncontrado && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center [border-width:0.5px]">
            <p className="text-[15px] text-red-600">Certificado não encontrado.</p>
            <Link href="/certificados" className="mt-4 inline-block text-[14px] font-semibold text-[#1d4ed8] hover:underline">
              Voltar para a lista
            </Link>
          </div>
        )}

        {/* Sucesso */}
        {!carregando && sucesso && (
          <div className="rounded-2xl border border-[#bbf7d0] bg-white p-10 text-center shadow-[0_4px_24px_rgba(22,163,74,0.08)] [border-width:0.5px]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold text-[#15803d]"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
            >
              Certificado gerado com sucesso!
            </h2>
            <p className="mt-2 text-[14px] text-[#475569]">
              O arquivo foi salvo e o status atualizado para <strong>Emitido</strong>.
            </p>
            <Link
              href="/certificados"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af]"
            >
              Ver todos os certificados
            </Link>
          </div>
        )}

        {/* Formulário de geração */}
        {!carregando && certificado && !sucesso && (
          <div className="overflow-hidden rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
            {/* Resumo */}
            <div className="border-b border-[#e2e8f0] bg-[#f8faff] p-8 [border-width:0.5px]">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">Voluntário</p>
              <p className="text-[18px] font-bold text-[#1e3a8a]">{certificado.voluntario}</p>

              <div className="mt-5 grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">Horas</p>
                  <p className="text-[22px] font-bold text-[#1d4ed8]">
                    {certificado.qtdeHoras}
                    <span className="ml-1 text-[14px] font-medium text-[#64748b]">
                      {certificado.qtdeHoras === 1 ? "hora" : "horas"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">Status atual</p>
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-1 text-[12px] font-medium text-[#d97706]">
                    {certificado.status}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#94a3b8]">Atividade realizada</p>
                <p className="text-[14px] leading-relaxed text-[#475569]">{certificado.atividade}</p>
              </div>
            </div>

            {/* Ação */}
            <div className="p-8">
              <div className="mb-6 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3.5 text-[13px] text-[#475569] [border-width:0.5px]">
                <strong className="text-[#1e3a8a]">O que acontecerá:</strong>{" "}
                Um certificado PDF será gerado com os logotipos do Rotary e ConectaServir,
                salvo automaticamente no registro e o status será atualizado para{" "}
                <strong>Emitido</strong>.
              </div>

              {erro && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {erro}
                </div>
              )}

              <button
                type="button"
                onClick={handleGerar}
                disabled={gerando}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#1d4ed8] px-6 py-[14px] text-[15px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {gerando ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Gerando certificado...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    Gerar certificado agora
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
