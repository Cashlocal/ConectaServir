"use client";

import { useState } from "react";
import {
  AREAS_INTERESSE,
  formInputClass,
  formLabelClass,
} from "@/lib/constants";
import {
  isValidEmail,
  isValidPhoneBROptional,
  maskEmailInput,
  maskPhoneBR,
  MSG_EMAIL_INVALIDO,
  MSG_TELEFONE_INVALIDO,
} from "@/lib/inputMasks";

const initial = {
  nomeCompleto: "",
  email: "",
  telefone: "",
  localizacao: "",
  sobreVoce: "",
  habilidades: "",
  disponibilidade: "",
};

function req() {
  return <span className="text-red-500">*</span>;
}

function inputErrorRing(active: boolean) {
  return active
    ? " border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]"
    : "";
}

const formCardClass =
  "rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.07)] md:px-12 md:py-10";

export function VoluntarioForm() {
  const [form, setForm] = useState(initial);
  const [areas, setAreas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(AREAS_INTERESSE.map((a) => [a, false]))
  );
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    telefone?: string;
  }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );

  function toggleArea(name: string) {
    setAreas((s) => ({ ...s, [name]: !s[name] }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErr: { email?: string; telefone?: string } = {};
    if (!isValidEmail(form.email)) nextErr.email = MSG_EMAIL_INVALIDO;
    if (!isValidPhoneBROptional(form.telefone))
      nextErr.telefone = MSG_TELEFONE_INVALIDO;
    if (Object.keys(nextErr).length > 0) {
      setFieldErrors(nextErr);
      return;
    }
    setFieldErrors({});
    setStatus("loading");
    const areasInteresse = AREAS_INTERESSE.filter((a) => areas[a]);
    try {
      const res = await fetch("/api/voluntarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeCompleto: form.nomeCompleto,
          email: form.email.trim().toLowerCase(),
          telefone: form.telefone,
          localizacao: form.localizacao,
          sobreVoce: form.sobreVoce,
          habilidades: form.habilidades,
          disponibilidade: form.disponibilidade,
          areasInteresse,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || data.success !== true) {
        setStatus("err");
        return;
      }
      setStatus("ok");
      setForm(initial);
      setFieldErrors({});
      setAreas(Object.fromEntries(AREAS_INTERESSE.map((a) => [a, false])));
    } catch {
      setStatus("err");
    }
  }

  if (status === "ok") {
    return (
      <div
        className={`${formCardClass} flex flex-col items-center border border-[#8fb0e8] bg-[#eef3fc] text-center`}
        role="status"
      >
        <span className="text-3xl font-semibold text-[#1a44a6]" aria-hidden>
          ✓
        </span>
        <h2 className="mt-3 text-lg font-semibold text-[#0f172a]">
          Cadastro realizado com sucesso!
        </h2>
        <p className="mt-2 text-sm text-[#475569]">
          Em breve entraremos em contato.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setFieldErrors({});
          }}
          className="mt-6 rounded-lg border-2 border-[#1a44a6] bg-white px-6 py-2.5 text-sm font-semibold text-[#1a44a6] transition-colors hover:bg-[#eef3fc]"
        >
          Novo cadastro
        </button>
      </div>
    );
  }

  return (
    <div className={formCardClass}>
      {status === "err" ? (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800"
          role="alert"
        >
          Ocorreu um erro. Tente novamente.
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <div className="space-y-6">
        <div>
          <label htmlFor="vol-nome" className={formLabelClass}>
            Nome completo {req()}
          </label>
          <input
            id="vol-nome"
            required
            autoComplete="name"
            value={form.nomeCompleto}
            onChange={(e) =>
              setForm((s) => ({ ...s, nomeCompleto: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="vol-email" className={formLabelClass}>
            Email {req()}
          </label>
          <input
            id="vol-email"
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="nome@email.com"
            required
            value={form.email}
            onChange={(e) => {
              setFieldErrors((s) => ({ ...s, email: undefined }));
              setForm((s) => ({ ...s, email: maskEmailInput(e.target.value) }));
            }}
            onBlur={() =>
              setForm((s) => ({ ...s, email: s.email.trim().toLowerCase() }))
            }
            className={`${formInputClass}${inputErrorRing(Boolean(fieldErrors.email))}`}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "vol-email-err" : undefined}
          />
          {fieldErrors.email ? (
            <p id="vol-email-err" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="vol-telefone" className={formLabelClass}>
            Telefone
          </label>
          <input
            id="vol-telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={(e) => {
              setFieldErrors((s) => ({ ...s, telefone: undefined }));
              setForm((s) => ({
                ...s,
                telefone: maskPhoneBR(e.target.value),
              }));
            }}
            className={`${formInputClass}${inputErrorRing(Boolean(fieldErrors.telefone))}`}
            aria-invalid={Boolean(fieldErrors.telefone)}
            aria-describedby={
              fieldErrors.telefone ? "vol-tel-err" : undefined
            }
          />
          {fieldErrors.telefone ? (
            <p id="vol-tel-err" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.telefone}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="vol-localizacao" className={formLabelClass}>
            Localização
          </label>
          <input
            id="vol-localizacao"
            value={form.localizacao}
            onChange={(e) =>
              setForm((s) => ({ ...s, localizacao: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="vol-sobreVoce" className={formLabelClass}>
            Sobre você
          </label>
          <textarea
            id="vol-sobreVoce"
            rows={4}
            value={form.sobreVoce}
            onChange={(e) =>
              setForm((s) => ({ ...s, sobreVoce: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="vol-habilidades" className={formLabelClass}>
            Habilidades
          </label>
          <textarea
            id="vol-habilidades"
            rows={3}
            value={form.habilidades}
            onChange={(e) =>
              setForm((s) => ({ ...s, habilidades: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="vol-disponibilidade" className={formLabelClass}>
            Disponibilidade
          </label>
          <input
            id="vol-disponibilidade"
            placeholder="Ex.: fins de semana, manhãs…"
            value={form.disponibilidade}
            onChange={(e) =>
              setForm((s) => ({ ...s, disponibilidade: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <fieldset>
          <legend className={`${formLabelClass} mb-3`}>
            Áreas de interesse
          </legend>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AREAS_INTERESSE.map((area) => (
              <li key={area}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={areas[area] ?? false}
                    onChange={() => toggleArea(area)}
                    className="size-4 shrink-0 rounded border border-[#cbd5e1] text-[#1a44a6] accent-[#1a44a6] focus:outline-none focus:ring-2 focus:ring-[rgba(26,68,166,0.3)]"
                  />
                  <span className="text-sm text-[#0f172a]">{area}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-8 w-full rounded-lg bg-[#1a44a6] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#153575] disabled:cursor-not-allowed disabled:opacity-90"
        >
          {status === "loading" ? "Enviando..." : "Enviar cadastro"}
        </button>
      </form>
    </div>
  );
}
