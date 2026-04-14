"use client";

import { useEffect, useMemo, useState } from "react";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MESES_ABREV = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  };
}

function utcToday() {
  const n = new Date();
  return {
    dia: n.getUTCDate(),
    mes: n.getUTCMonth(),
    ano: n.getUTCFullYear(),
  };
}

function utcTomorrow() {
  const n = new Date();
  const t = new Date(
    Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1)
  );
  return {
    dia: t.getUTCDate(),
    mes: t.getUTCMonth(),
    ano: t.getUTCFullYear(),
  };
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
    cells.push({
      day: nextDay++,
      month: nm,
      year: ny,
      isCurrentMonth: false,
    });
  }

  return cells;
}

export default function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [mesIdx, setMesIdx] = useState(now.getUTCMonth());
  const [anoIdx, setAnoIdx] = useState(now.getUTCFullYear());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/eventos");
        const data = await res.json();
        const raw = data.error ? [] : data.records;
        const list = Array.isArray(raw) ? raw : [];
        if (!cancelled) setEventos(list);
      } catch {
        if (!cancelled) setEventos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const eventosDoMes = useMemo(() => {
    return eventos.filter((ev) => {
      const p = parseEventoData(ev.data);
      if (!p) return false;
      return p.mes === mesIdx && p.ano === anoIdx;
    });
  }, [eventos, mesIdx, anoIdx]);

  const cells = useMemo(
    () => buildCalendarCells(anoIdx, mesIdx),
    [anoIdx, mesIdx]
  );

  const hoje = utcToday();
  const amanha = utcTomorrow();

  function prevMonth() {
    if (mesIdx === 0) {
      setMesIdx(11);
      setAnoIdx((y) => y - 1);
    } else {
      setMesIdx((m) => m - 1);
    }
  }

  function nextMonth() {
    if (mesIdx === 11) {
      setMesIdx(0);
      setAnoIdx((y) => y + 1);
    } else {
      setMesIdx((m) => m + 1);
    }
  }

  function badgePara(ev) {
    const p = parseEventoData(ev.data);
    if (!p) return null;
    if (mesmoDiaUtc(p, hoje)) return "hoje";
    if (mesmoDiaUtc(p, amanha)) return "amanha";
    return null;
  }

  return (
    <main className="bg-[#eff6ff] px-6 py-12 md:px-16 md:py-[48px]">
      <h1
        className="text-center text-[40px] font-bold leading-tight text-[#1e3a8a] md:text-left"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        Calendário de Eventos
      </h1>
      <p className="mb-8 mt-2 text-center text-base text-[#475569] md:mb-8 md:text-left">
        Acompanhe as atividades e iniciativas do clube
      </p>

      {/* Mini calendário */}
      <div className="mx-auto max-w-[480px] rounded-2xl border border-[#bfdbfe] bg-white p-5 [border-width:0.5px]">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base font-semibold text-[#1e3a8a]">
            {MESES[mesIdx]} {anoIdx}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border border-[#bfdbfe] px-3 py-1 text-sm text-[#475569] [border-width:0.5px] transition-colors hover:bg-[#eff6ff]"
              aria-label="Mês anterior"
            >
              ←
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border border-[#bfdbfe] px-3 py-1 text-sm text-[#475569] [border-width:0.5px] transition-colors hover:bg-[#eff6ff]"
              aria-label="Próximo mês"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="py-1.5 text-center text-xs text-[#94a3b8]"
            >
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            const key = `${cell.year}-${cell.month}-${cell.day}`;
            const tem = eventosPorDia.has(key);
            const isToday =
              cell.day === hoje.dia &&
              cell.month === hoje.mes &&
              cell.year === hoje.ano;
            const isCurrent = cell.isCurrentMonth;

            return (
              <div
                key={`${key}-${i}`}
                className={`relative flex min-h-[36px] flex-col items-center justify-center rounded-md py-1.5 text-center text-[13px] ${
                  !isCurrent ? "text-[#cbd5e1]" : "text-[#0f172a]"
                } ${
                  isToday
                    ? "bg-[#1d4ed8] font-semibold text-white"
                    : tem && isCurrent
                      ? "cursor-pointer font-semibold text-[#1d4ed8] hover:bg-[#eff6ff]"
                      : "cursor-default"
                } `}
              >
                <span>{cell.day}</span>
                {tem && isCurrent && !isToday ? (
                  <span className="mt-0.5 h-1 w-1 rounded-full bg-[#1d4ed8]" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="mx-auto mt-6 max-w-[480px]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">
          Eventos de {MESES[mesIdx]}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((k) => (
              <div
                key={k}
                className="h-20 rounded-2xl bg-[#dbeafe] opacity-60"
                style={{
                  animation: "eventosSkel 1.2s ease-in-out infinite",
                }}
              />
            ))}
            <style>{`
              @keyframes eventosSkel {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
              }
            `}</style>
          </div>
        ) : eventosDoMes.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-[#94a3b8]">
            Nenhum evento este mês.
          </p>
        ) : (
          eventosDoMes.map((ev) => {
            const p = parseEventoData(ev.data);
            const horario = p ? `${p.hora}:${p.min}` : "";
            const badge = badgePara(ev);
            const isEvToday = badge === "hoje";

            return (
              <div
                key={ev.id}
                className="mb-2.5 flex gap-4 rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3.5 transition-all [border-width:0.5px] last:mb-0 hover:border-[#bfdbfe] hover:shadow-[0_2px_12px_rgba(29,78,216,0.06)] md:p-5"
              >
                <div
                  className={`flex w-11 shrink-0 flex-col items-center justify-center rounded-[10px] border border-[#93c5fd] px-1.5 py-2 text-center [border-width:0.5px] md:w-[52px] ${
                    isEvToday
                      ? "bg-[#1d4ed8] [&_span]:text-white"
                      : "bg-[#eff6ff]"
                  }`}
                >
                  <span
                    className={`text-xl font-semibold leading-none text-[#1d4ed8] md:text-2xl ${
                      isEvToday ? "!text-white" : ""
                    }`}
                  >
                    {p?.dia}
                  </span>
                  <span
                    className={`mt-1 text-[10px] font-medium uppercase text-[#1d4ed8] md:text-[11px] ${
                      isEvToday ? "!text-white" : ""
                    }`}
                  >
                    {p != null ? MESES_ABREV[p.mes] : ""}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-[#1e3a8a]">
                      {ev.nome}
                    </h2>
                    {badge === "hoje" ? (
                      <span className="ml-2 rounded-full bg-[#dbeafe] px-2 py-0.5 text-[11px] text-[#1d4ed8]">
                        Hoje
                      </span>
                    ) : null}
                    {badge === "amanha" ? (
                      <span className="ml-2 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] text-[#d97706]">
                        Amanhã
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[13px] text-[#475569]">{horario}</p>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-[#94a3b8]">
                    {ev.descricao}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
