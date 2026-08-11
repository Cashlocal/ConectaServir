"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Certificado = {
  id: string;
  voluntario: string;
  qtdeHoras: number;
  atividade: string;
  status: string;
  arquivoUrl: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  Pendente: "bg-[#fef3c7] text-[#d97706]",
  Emitido: "bg-[#dcfce7] text-[#16a34a]",
  Aprovado: "bg-[#dcfce7] text-[#16a34a]",
  Rejeitado: "bg-[#fee2e2] text-[#dc2626]",
};

export default function CertificadosPage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [carregando, setCarregando] = useState(true);

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
    (async () => {
      try {
        const res = await fetch("/api/certificados");
        const data = await res.json();
        setCertificados(Array.isArray(data) ? data : []);
      } catch {
        setCertificados([]);
      } finally {
        setCarregando(false);
      }
    })();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1
            className="text-[40px] font-bold leading-tight text-[#1e3a8a]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Certificados
          </h1>
          <p className="mt-2 text-base text-[#475569]">
            Horas de voluntariado registradas
          </p>
        </div>
        <Link
          href="/certificados/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] md:self-auto self-start"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Emitir novo certificado
        </Link>
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="space-y-3">
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              className="h-24 rounded-2xl bg-[#dbeafe] opacity-60"
              style={{ animation: "certSkel 1.2s ease-in-out infinite" }}
            />
          ))}
          <style>{`@keyframes certSkel { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
        </div>
      ) : certificados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#dbeafe]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-[16px] font-medium text-[#475569]">Nenhum certificado registrado ainda.</p>
          <Link href="/certificados/novo" className="mt-4 text-[14px] font-semibold text-[#1d4ed8] hover:underline">
            Registrar o primeiro
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {certificados.map((cert) => {
            const statusClass = STATUS_STYLE[cert.status] ?? "bg-[#f1f5f9] text-[#475569]";
            const isPendente = cert.status === "Pendente";
            const isEmitido = cert.status === "Emitido";

            return (
              <div
                key={cert.id}
                className="flex flex-col gap-3 rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 transition-all [border-width:0.5px] hover:border-[#bfdbfe] hover:shadow-[0_2px_12px_rgba(29,78,216,0.07)] sm:flex-row sm:items-center sm:gap-6"
              >
                {/* Horas */}
                <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-[10px] border border-[#93c5fd] bg-[#eff6ff] px-2 py-3 text-center [border-width:0.5px]">
                  <span className="text-2xl font-bold leading-none text-[#1d4ed8]">
                    {cert.qtdeHoras}
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase text-[#1d4ed8]">
                    {cert.qtdeHoras === 1 ? "hora" : "horas"}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-[#1e3a8a]">
                      {cert.voluntario}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusClass}`}>
                      {cert.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#64748b]">
                    {cert.atividade}
                  </p>
                </div>

                {/* Ações */}
                <div className="shrink-0">
                  {isPendente && (
                    <Link
                      href={`/certificados/${cert.id}/gerar`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-2 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] [border-width:0.5px]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                      Gerar certificado
                    </Link>
                  )}

                  {isEmitido && cert.arquivoUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={cert.arquivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3.5 py-2 text-[13px] font-semibold text-[#16a34a] transition-colors hover:bg-[#dcfce7] [border-width:0.5px]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Visualizar
                      </a>
                      <a
                        href={`/api/certificados/download?url=${encodeURIComponent(cert.arquivoUrl)}&filename=${encodeURIComponent(`certificado-${cert.voluntario.replace(/\s+/g, "-").toLowerCase()}.pdf`)}`}
                        download
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3.5 py-2 text-[13px] font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] [border-width:0.5px]"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </a>
                    </div>
                  )}

                  {isEmitido && !cert.arquivoUrl && (
                    <span className="text-[12px] text-[#94a3b8]">Arquivo indisponível</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
