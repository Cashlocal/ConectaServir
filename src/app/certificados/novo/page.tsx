"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Voluntario = { id: string; nome: string };

export default function NovoCertificadoPage() {
  const router = useRouter();

  const [pronto, setPronto] = useState(false);
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [carregandoVols, setCarregandoVols] = useState(true);

  const [voluntario, setVoluntario] = useState("");
  const [qtdeHoras, setQtdeHoras] = useState("");
  const [atividade, setAtividade] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

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
        const res = await fetch("/api/voluntarios-lista");
        const data = await res.json();
        setVoluntarios(Array.isArray(data) ? data : []);
      } catch {
        setVoluntarios([]);
      } finally {
        setCarregandoVols(false);
      }
    })();
  }, [pronto]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/certificados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voluntario, qtdeHoras: Number(qtdeHoras), atividade }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setErro("Ocorreu um erro. Tente novamente."); return; }
      setSucesso(true);
    } catch {
      setErro("Ocorreu um erro. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  function resetar() {
    setVoluntario(""); setQtdeHoras(""); setAtividade(""); setErro(""); setSucesso(false);
  }

  if (!pronto) return null;

  const inputClass =
    "w-full rounded-xl border border-[#bfdbfe] bg-[#f8faff] px-4 py-3 text-[15px] text-[#0f172a] placeholder-[#94a3b8] outline-none transition-all [border-width:0.5px] focus:border-[#1a44a6] focus:bg-white focus:ring-2 focus:ring-[#1a44a6]/15";

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Voltar */}
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
        className="text-center text-[40px] font-bold leading-tight text-[#1e3a8a] md:text-left"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        Lançar Certificado
      </h1>
      <p className="mb-8 mt-2 text-center text-base text-[#475569] md:text-left">
        Registre as horas de voluntariado realizadas
      </p>

      <div className="mx-auto max-w-[560px]">
        {sucesso ? (
          <div className="rounded-2xl border border-[#bfdbfe] bg-white p-10 text-center shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1e3a8a]" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Certificado registrado com sucesso!
            </h2>
            <p className="mt-2 text-[15px] text-[#475569]">As horas de voluntariado foram lançadas.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetar}
                className="inline-flex items-center gap-2 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-5 py-2.5 text-[14px] font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] [border-width:0.5px]"
              >
                Registrar outro
              </button>
              <Link
                href="/certificados"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af]"
              >
                Ver todos
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#bfdbfe] bg-white shadow-[0_4px_24px_rgba(29,78,216,0.07)] [border-width:0.5px]">
            <form onSubmit={handleSubmit} noValidate className="space-y-6 p-10">
              <div>
                <label htmlFor="voluntario" className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Voluntário <span className="text-[#dc2626]">*</span>
                </label>
                <select id="voluntario" required value={voluntario} onChange={(e) => setVoluntario(e.target.value)} disabled={carregandoVols} className={inputClass}>
                  <option value="">{carregandoVols ? "Carregando voluntários..." : "Selecione o voluntário..."}</option>
                  {voluntarios.map((v) => (
                    <option key={v.id} value={v.nome}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="qtdeHoras" className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Quantidade de Horas <span className="text-[#dc2626]">*</span>
                </label>
                <input id="qtdeHoras" type="number" min={1} max={999} required value={qtdeHoras} onChange={(e) => setQtdeHoras(e.target.value)} placeholder="Ex: 4" className={inputClass} />
              </div>

              <div>
                <label htmlFor="atividade" className="mb-1.5 block text-sm font-medium text-[#1e3a8a]">
                  Descrição da Atividade <span className="text-[#dc2626]">*</span>
                </label>
                <textarea id="atividade" rows={4} required value={atividade} onChange={(e) => setAtividade(e.target.value)} placeholder="Descreva a atividade realizada..." className={`${inputClass} resize-none`} />
              </div>

              {erro && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 [border-width:0.5px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando || !voluntario || !qtdeHoras || !atividade}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#1d4ed8] px-6 py-[14px] text-[15px] font-semibold text-white transition-colors hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Registrando...
                  </>
                ) : "Registrar Certificado"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
