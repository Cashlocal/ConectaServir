import { NextResponse } from "next/server";

/** Nomes das colunas no Airtable — devem coincidir byte a byte com a base. */
const AIRTABLE_FIELDS = {
  nomeProjeto: "Nome do Projeto",
  descricao: "Descrição",
  categoria: "Categoria",
  localizacao: "Localização",
  voluntariosNecessarios: "Voluntários Necessários",
  nomeResponsavel: "Nome Responsável",
  email: "Email",
  telefone: "Telefone",
};

export async function POST(request) {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_PROJETOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      nomeProjeto,
      descricao,
      categoria,
      localizacao,
      voluntariosNecessarios,
      nomeResponsavel,
      email,
      telefone,
    } = body;

    if (
      !nomeProjeto?.trim() ||
      !descricao?.trim() ||
      !categoria?.trim() ||
      !email?.trim()
    ) {
      return NextResponse.json(
        { error: "Preencha os campos obrigatórios." },
        { status: 400 }
      );
    }

    const num = Number(voluntariosNecessarios);
    const fields = {
      [AIRTABLE_FIELDS.nomeProjeto]: nomeProjeto.trim(),
      [AIRTABLE_FIELDS.descricao]: descricao.trim(),
      [AIRTABLE_FIELDS.categoria]: categoria.trim(),
      [AIRTABLE_FIELDS.localizacao]: (localizacao ?? "").trim(),
      [AIRTABLE_FIELDS.voluntariosNecessarios]: Number.isFinite(num)
        ? num
        : 0,
      [AIRTABLE_FIELDS.nomeResponsavel]: (nomeResponsavel ?? "").trim(),
      [AIRTABLE_FIELDS.email]: email.trim(),
      [AIRTABLE_FIELDS.telefone]: (telefone ?? "").trim(),
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
