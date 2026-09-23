"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

const MESES_ABREV = [
  "JAN","FEV","MAR","ABR","MAI","JUN",
  "JUL","AGO","SET","OUT","NOV","DEZ",
];

const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const GRADIENTS = [
  "from-[#1e3a8a] to-[#1d4ed8]",
  "from-[#065f46] to-[#059669]",
  "from-[#7c2d12] to-[#ea580c]",
  "from-[#4c1d95] to-[#7c3aed]",
  "from-[#0c4a6e] to-[#0ea5e9]",
  "from-[#831843] to-[#ec4899]",
];

function parseEventoData(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    dia: d.getUTCDate(),
    mes: d.getUTCMonth(),
    ano: d.getUTCFullYear(),
    hora: String(d.getUTCHours()).padStart(2, "0"),
    min: String(d.getUTCMinutes()).padStart(2, "0"),
    diaSemana: d.getUTCDay(),
  };
}

function utcToday() {
  const n = new Date();
  return { dia: n.getUTCDate(), mes: n.getUTCMonth(), ano: n.getUTCFullYear() };
}

function utcTomorrow() {
  const n = new Date();
  const t = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1));
  return { dia: t.getUTCDate(), mes: t.getUTCMonth(), ano: t.getUTCFullYear() };
}

function mesmoDiaUtc(a, b) {
  return a.dia === b.dia && a.mes === b.mes && a.ano === b.ano;
}

function buildCalendarCells(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const startPad = first.getUTCDay();
  const dim = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const daysInPrev = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) {
    const day = daysInPrev - startPad + i + 1;
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    cells.push({ day, month: pm, year: py, isCurrentMonth: false });
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ day: d, month, year, isCurrentMonth: true });
  }
  let nextDay = 1;
  const nm = month === 11 ? 0 : month + 1;
  const ny = month === 11 ? year + 1 : year;
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, month: nm, year: ny, isCurrentMonth: false });
  }
  return cells;
}

const FILTROS = [
  { id: "mes",    label: "Este mês"        },
  { id: "hoje",   label: "Hoje"            },
  { id: "semana", label: "Esta semana"     },
  { id: "15dias", label: "Próximos 15 dias"},
];

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [filtro, setFiltro] = useState("mes");
  const now = new Date();
  const [mesIdx, setMesIdx] = useState(now.getUTCMonth());
  const [anoIdx, setAnoIdx] = useState(now.getUTCFullYear());

  useEffect(() => {
    try {
      const raw = localStorage.getItem("usuario");
      if (raw) setUsuarioLogado(true);
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/eventos");
        const data = await res.json();
        const raw = data.error ? [] : data.records ?? data;
        if (!cancelled) setEventos(Array.isArray(raw) ? raw : []);
      } catch {
        if (!cancelled) setEventos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const eventosPorDia = useMemo(() => {
    const map = new Map();
    for (const ev of eventos) {
      const p = parseEventoData(ev.data);
      if (!p) continue;
      const key = `${p.ano}-${p.mes}-${p.dia}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [eventos]);

  const eventosDoMes = useMemo(() =>
    eventos.filter((ev) => {
      const p = parseEventoData(ev.data);
      return p && p.mes === mesIdx && p.ano === anoIdx;
    }),
    [eventos, mesIdx, anoIdx]
  );

  const eventosFiltrados = useMemo(() => {
    const n = new Date();
    const todayMs = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());

    if (filtro === "hoje") {
      return eventos.filter((ev) => {
        const p = parseEventoData(ev.data);
        if (!p) return false;
        return Date.UTC(p.ano, p.mes, p.dia) === todayMs;
      });
    }

    if (filtro === "semana") {
      const dow = n.getUTCDay();
      const inicioMs = todayMs - dow * 86400000;
      const fimMs    = inicioMs + 6 * 86400000;
      return eventos.filter((ev) => {
        const p = parseEventoData(ev.data);
        if (!p) return false;
        const evMs = Date.UTC(p.ano, p.mes, p.dia);
        return evMs >= inicioMs && evMs <= fimMs;
      });
    }

    if (filtro === "15dias") {
      const fimMs = todayMs + 14 * 86400000;
      return eventos.filter((ev) => {
        const p = parseEventoData(ev.data);
        if (!p) return false;
        const evMs = Date.UTC(p.ano, p.mes, p.dia);
        return evMs >= todayMs && evMs <= fimMs;
      });
    }

    // "mes" — padrão
    return eventosDoMes;
  }, [filtro, eventos, eventosDoMes]);

  const cells = useMemo(() => buildCalendarCells(anoIdx, mesIdx), [anoIdx, mesIdx]);
  const hoje = utcToday();
  const amanha = utcTomorrow();

  function prevMonth() {
    if (mesIdx === 0) { setMesIdx(11); setAnoIdx((y) => y - 1); }
    else setMesIdx((m) => m - 1);
  }
  function nextMonth() {
    if (mesIdx === 11) { setMesIdx(0); setAnoIdx((y) => y + 1); }
    else setMesIdx((m) => m + 1);
  }

  function badgePara(ev) {
    const p = parseEventoData(ev.data);
    if (!p) return null;
    if (mesmoDiaUtc(p, hoje)) return "hoje";
    if (mesmoDiaUtc(p, amanha)) return "amanha";
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-120px)] bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      {/* Cabeçalho */}
      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1
            className="text-[32px] font-bold leading-tight text-[#1e3a8a] md:text-[40px]"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Calendário de Eventos
          </h1>
          <p className="mt-2 text-base text-[#475569]">
            Acompanhe as atividades e iniciativas do clube
          </p>
        </div>
        {usuarioLogado && (
          <Link
            href="/eventos-admin"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-[#1d4ed8] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1e40af] sm:mt-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Evento
          </Link>
        )}
      </div>

      {/* Botões de filtro */}
        <div className="mt-5 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors
                ${filtro === f.id
                  ? "bg-[#1d4ed8] text-white shadow-sm"
                  : "border border-[#bfdbfe] bg-white text-[#1e3a8a] hover:bg-[#eff6ff] [border-width:0.5px]"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Coluna esquerda: mini calendário */}
        <div className="shrink-0 lg:w-[320px]">
          <div className="rounded-2xl border border-[#bfdbfe] bg-white p-5 shadow-[0_4px_20px_rgba(29,78,216,0.07)] [border-width:0.5px]">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold text-[#1e3a8a]">
                {MESES[mesIdx]} {anoIdx}
              </span>
              {filtro === "mes" && (
              <div className="flex gap-2">
                <button type="button" onClick={prevMonth}
                  className="rounded-lg border border-[#bfdbfe] px-3 py-1 text-sm text-[#475569] [border-width:0.5px] transition-colors hover:bg-[#eff6ff]"
                  aria-label="Mês anterior">←</button>
                <button type="button" onClick={nextMonth}
                  className="rounded-lg border border-[#bfdbfe] px-3 py-1 text-sm text-[#475569] [border-width:0.5px] transition-colors hover:bg-[#eff6ff]"
                  aria-label="Próximo mês">→</button>
              </div>
              )}
            </div>

            <div className="grid grid-cols-7 gap-0">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="py-1.5 text-center text-xs text-[#94a3b8]">{d}</div>
              ))}
              {cells.map((cell, i) => {
                const key = `${cell.year}-${cell.month}-${cell.day}`;
                const tem = eventosPorDia.has(key);
                const isToday = cell.day === hoje.dia && cell.month === hoje.mes && cell.year === hoje.ano;
                const isCurrent = cell.isCurrentMonth;
                return (
                  <div key={`${key}-${i}`}
                    className={`relative flex min-h-[36px] flex-col items-center justify-center rounded-md py-1.5 text-center text-[13px]
                      ${!isCurrent ? "text-[#cbd5e1]" : "text-[#0f172a]"}
                      ${isToday ? "bg-[#1d4ed8] font-semibold text-white" :
                        tem && isCurrent ? "cursor-pointer font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]" : "cursor-default"}`}
                  >
                    <span>{cell.day}</span>
                    {tem && isCurrent && !isToday && (
                      <span className="mt-0.5 h-1 w-1 rounded-full bg-[#1d4ed8]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda do mês */}
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
            {eventosFiltrados.length} evento{eventosFiltrados.length !== 1 ? "s" : ""}
            {filtro === "mes" ? ` em ${MESES[mesIdx]}` :
             filtro === "hoje" ? " hoje" :
             filtro === "semana" ? " esta semana" :
             " nos próximos 15 dias"}
          </p>
        </div>

        {/* Coluna direita: grid de cards */}
        <div className="flex-1">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
            {filtro === "mes"    ? `Eventos de ${MESES[mesIdx]}` :
             filtro === "hoje"   ? "Eventos de hoje" :
             filtro === "semana" ? "Eventos desta semana" :
             "Próximos 15 dias"}
          </p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3].map((k) => (
                <div key={k} className="h-64 rounded-2xl bg-[#dbeafe] opacity-60"
                  style={{ animation: "eventosSkel 1.2s ease-in-out infinite" }} />
              ))}
              <style>{`@keyframes eventosSkel { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }`}</style>
            </div>
          ) : eventosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#bfdbfe] bg-white py-20 [border-width:0.5px]">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dbeafe]">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p className="text-[15px] font-medium text-[#1e3a8a]">Nenhum evento este mês</p>
              <p className="mt-1 text-sm text-[#94a3b8]">Navegue pelos meses para ver outros eventos.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {eventosFiltrados.map((ev, idx) => {
                const p = parseEventoData(ev.data);
                const horario = p ? `${p.hora}:${p.min}` : "";
                const badge = badgePara(ev);
                const gradient = GRADIENTS[idx % GRADIENTS.length];

                return (
                  <div key={ev.id}
                    className="group overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_2px_12px_rgba(29,78,216,0.07)] transition-all duration-200 [border-width:0.5px] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(29,78,216,0.14)]"
                  >
                    {/* Imagem / placeholder */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      {ev.banner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ev.banner}
                          alt={ev.nome}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${gradient}`}>
                          <span className="text-5xl font-bold leading-none text-white/90">
                            {p?.dia}
                          </span>
                          <span className="mt-1 text-[13px] font-semibold uppercase tracking-widest text-white/70">
                            {p != null ? MESES_ABREV[p.mes] : ""}
                          </span>
                        </div>
                      )}

                      {/* Badge hoje / amanhã */}
                      {badge && (
                        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow
                          ${badge === "hoje" ? "bg-[#1d4ed8] text-white" : "bg-[#fef3c7] text-[#d97706]"}`}>
                          {badge === "hoje" ? "Hoje" : "Amanhã"}
                        </span>
                      )}

                      {/* Data sobreposta quando tem banner */}
                      {ev.banner && p && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span className="text-[11px] font-medium text-white">
                            {p.dia} {MESES_ABREV[p.mes]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4">
                      <h2 className="line-clamp-1 text-[15px] font-semibold text-[#1e3a8a]">
                        {ev.nome}
                      </h2>

                      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#475569]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{horario || "—"}</span>
                        {p && (
                          <>
                            <span className="text-[#cbd5e1]">·</span>
                            <span>{DIAS_SEMANA[p.diaSemana]}, {p.dia} {MESES_ABREV[p.mes]}</span>
                          </>
                        )}
                      </div>

                      {ev.descricao && (
                        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#94a3b8]">
                          {ev.descricao}
                        </p>
                      )}

                      {/* Entidade vinculada */}
                      {ev.entidade && (
                        <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#f1f5f9] pt-2.5">
                          {ev.entidadeLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={ev.entidadeLogo}
                              alt={ev.entidade}
                              className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-[#bfdbfe]"
                            />
                          ) : (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8] text-[9px] font-bold text-white">
                              {ev.entidade.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate text-[11px] font-medium text-[#475569]">
                            {ev.entidade}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
