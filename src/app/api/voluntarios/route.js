import { NextResponse } from "next/server";

/** Nomes das colunas no Airtable — devem coincidir byte a byte com a base. */
const AIRTABLE_FIELDS = {
  nomeCompleto: "Nome Completo",
  email: "Email",
  telefone: "Telefone",
  localizacao: "Localização",
  sobreVoce: "Sobre Você",
  habilidades: "Habilidades",
  disponibilidade: "Disponibilidade",
  areasInteresse: "Áreas de Interesse",
};

export async function POST(request) {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      nomeCompleto,
      email,
      telefone,
      localizacao,
      sobreVoce,
      habilidades,
      disponibilidade,
      areasInteresse,
    } = body;

    if (!nomeCompleto?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nome completo e email são obrigatórios." },
        { status: 400 }
      );
    }

    const areas = Array.isArray(areasInteresse)
      ? areasInteresse.filter((a) => typeof a === "string" && a.trim() !== "")
      : [];

    const fields = {
      [AIRTABLE_FIELDS.nomeCompleto]: nomeCompleto.trim(),
      [AIRTABLE_FIELDS.email]: email.trim(),
      [AIRTABLE_FIELDS.telefone]: (telefone ?? "").trim(),
      [AIRTABLE_FIELDS.localizacao]: (localizacao ?? "").trim(),
      [AIRTABLE_FIELDS.sobreVoce]: (sobreVoce ?? "").trim(),
      [AIRTABLE_FIELDS.habilidades]: (habilidades ?? "").trim(),
      [AIRTABLE_FIELDS.disponibilidade]: (disponibilidade ?? "").trim(),
      /** Multiple select: sempre array de strings, ex.: ["Saúde", "Educação"] */
      [AIRTABLE_FIELDS.areasInteresse]: areas,
    };

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    const text = await res.text();
    if (!res.ok) {
      let message = "Não foi possível salvar os dados.";
      try {
        const errJson = JSON.parse(text);
        if (errJson.error?.message) message = errJson.error.message;
      } catch {
        if (text) message = text;
      }
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
