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
    if (!pronto || !id) return;
    (async () => {
      try {
        const res = await fetch("/api/certificados");
        const data = await res.json();
        const found = Array.isArray(data)
          ? data.find((c: Certificado) => c.id === id)
          : null;
        if (!found) { setNaoEncontrado(true); return; }
        setCertificado(found);
      } catch {
        setNaoEncontrado(true);
      } finally {
        setCarregando(false);
      }
    })();
  }, [pronto, id]);

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

        {carregando && (
          <div className="h-48 animate-pulse rounded-2xl bg-[#dbeafe] opacity-60" />
        )}

        {!carregando && naoEncontrado && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center [border-width:0.5px]">
            <p className="text-[15px] text-red-600">Certificado não encontrado.</p>
            <Link href="/certificados" className="mt-4 inline-block text-[14px] font-semibold text-[#1d4ed8] hover:underline">
              Voltar para a lista
            </Link>
          </div>
        )}

        {!carregando && certificado && (
          <div className="rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
            {/* Resumo do certificado */}
            <div className="border-b border-[#e2e8f0] p-8 [border-width:0.5px]">
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-[#94a3b8]">Voluntário</p>
              <p className="text-[17px] font-semibold text-[#1e3a8a]">{certificado.voluntario}</p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-[#94a3b8]">Horas</p>
                  <p className="text-[17px] font-semibold text-[#0f172a]">{certificado.qtdeHoras}h</p>
                </div>
                <div>
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-[#94a3b8]">Status</p>
                  <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[12px] font-medium text-[#d97706]">
                    {certificado.status}
                  </span>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-[#94a3b8]">Atividade</p>
                <p className="text-[14px] leading-relaxed text-[#475569]">{certificado.atividade}</p>
              </div>
            </div>

            {/* Aviso de geração */}
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fef3c7]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-[#475569]">
                A geração do certificado será processada em breve.
              </p>
              <p className="mt-1.5 text-[13px] text-[#94a3b8]">
                Quando gerado, o arquivo ficará disponível para visualização nesta lista.
              </p>
              <Link
                href="/certificados"
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-5 py-2.5 text-[14px] font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] [border-width:0.5px]"
              >
                Voltar para certificados
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
