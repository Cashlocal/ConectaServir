"use client";

import { useState } from "react";
import {
  CATEGORIAS_PROJETO,
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
  nomeProjeto: "",
  descricao: "",
  categoria: "",
  localizacao: "",
  voluntariosNecessarios: "",
  nomeResponsavel: "",
  email: "",
  telefone: "",
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

export function ProjetoForm() {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    telefone?: string;
  }>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );

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
    try {
      const res = await fetch("/api/projetos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeProjeto: form.nomeProjeto,
          descricao: form.descricao,
          categoria: form.categoria,
          localizacao: form.localizacao,
          voluntariosNecessarios: form.voluntariosNecessarios,
          nomeResponsavel: form.nomeResponsavel,
          email: form.email.trim().toLowerCase(),
          telefone: form.telefone,
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
          Enviar outro projeto
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
          <label htmlFor="proj-nome" className={formLabelClass}>
            Nome do projeto {req()}
          </label>
          <input
            id="proj-nome"
            required
            value={form.nomeProjeto}
            onChange={(e) =>
              setForm((s) => ({ ...s, nomeProjeto: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="proj-descricao" className={formLabelClass}>
            Descrição {req()}
          </label>
          <textarea
            id="proj-descricao"
            required
            rows={4}
            value={form.descricao}
            onChange={(e) =>
              setForm((s) => ({ ...s, descricao: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="proj-categoria" className={formLabelClass}>
            Categoria {req()}
          </label>
          <select
            id="proj-categoria"
            required
            value={form.categoria}
            onChange={(e) =>
              setForm((s) => ({ ...s, categoria: e.target.value }))
            }
            className={formInputClass}
          >
            <option value="">Selecione…</option>
            {CATEGORIAS_PROJETO.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="proj-localizacao" className={formLabelClass}>
            Localização
          </label>
          <input
            id="proj-localizacao"
            value={form.localizacao}
            onChange={(e) =>
              setForm((s) => ({ ...s, localizacao: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="proj-numVoluntarios" className={formLabelClass}>
            Nº de voluntários necessários
          </label>
          <input
            id="proj-numVoluntarios"
            type="number"
            min={0}
            value={form.voluntariosNecessarios}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                voluntariosNecessarios: e.target.value,
              }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="proj-nomeResponsavel" className={formLabelClass}>
            Nome do responsável
          </label>
          <input
            id="proj-nomeResponsavel"
            value={form.nomeResponsavel}
            onChange={(e) =>
              setForm((s) => ({ ...s, nomeResponsavel: e.target.value }))
            }
            className={formInputClass}
          />
        </div>
        <div>
          <label htmlFor="proj-email" className={formLabelClass}>
            Email {req()}
          </label>
          <input
            id="proj-email"
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
            aria-describedby={fieldErrors.email ? "proj-email-err" : undefined}
          />
          {fieldErrors.email ? (
            <p id="proj-email-err" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div>
          <label htmlFor="proj-telefone" className={formLabelClass}>
            Telefone
          </label>
          <input
            id="proj-telefone"
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
              fieldErrors.telefone ? "proj-tel-err" : undefined
            }
          />
          {fieldErrors.telefone ? (
            <p id="proj-tel-err" className="mt-1.5 text-sm text-red-600">
              {fieldErrors.telefone}
            </p>
          ) : null}
        </div>
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-8 w-full rounded-lg bg-[#1a44a6] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#153575] disabled:cursor-not-allowed disabled:opacity-90"
        >
          {status === "loading" ? "Enviando..." : "Enviar projeto"}
        </button>
      </form>
    </div>
  );
}
