import { NextResponse } from "next/server";

const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

const FIELDS = {
  nomeProjeto:            "Nome do Projeto",
  descricao:              "Descrição",
  categoria:              "Categoria",
  localizacao:            "Localização",
  voluntariosNecessarios: "Voluntários Necessários",
  nomeResponsavel:        "Nome Responsável",
  email:                  "Email",
  telefone:               "Telefone",
  entidade:               "Entidade",
};

export async function PATCH(req, { params }) {
  const { id }  = await params;
  const apiKey  = process.env.AIRTABLE_API_KEY;
  const baseId  = process.env.AIRTABLE_BASE_ID;
  const table   = process.env.AIRTABLE_TABLE_PROJETOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  try {
    const {
      nomeProjeto, descricao, categoria, localizacao,
      voluntariosNecessarios, nomeResponsavel, email, telefone, entidadeId,
    } = await req.json();

    if (!nomeProjeto?.trim() || !descricao?.trim() || !categoria?.trim()) {
      return NextResponse.json({ error: "Preencha os campos obrigatórios." }, { status: 400 });
    }

    const num    = Number(voluntariosNecessarios);
    const fields = {
      [FIELDS.nomeProjeto]:            nomeProjeto.trim(),
      [FIELDS.descricao]:              descricao.trim(),
      [FIELDS.categoria]:              categoria.trim(),
      [FIELDS.localizacao]:            (localizacao ?? "").trim(),
      [FIELDS.voluntariosNecessarios]: Number.isFinite(num) ? num : 0,
      [FIELDS.nomeResponsavel]:        (nomeResponsavel ?? "").trim(),
      [FIELDS.email]:                  (email ?? "").trim(),
      [FIELDS.telefone]:               (telefone ?? "").trim(),
      [FIELDS.entidade]:               entidadeId ? [entidadeId] : [],
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao atualizar." },
        { status: res.status }
      );
    }

    // Resolve entidade name
    let entidadeNome = "";
    if (entidadeId) {
      try {
        const er = await fetch(
          `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${entidadeId}`,
          { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
        );
        if (er.ok) { const ed = await er.json(); entidadeNome = ed.fields?.["Nome"] ?? ""; }
      } catch {}
    }

    const entIds = data.fields[FIELDS.entidade];
    const entId  = Array.isArray(entIds) ? entIds[0] : null;

    return NextResponse.json({
      id:                     data.id,
      nomeProjeto:            data.fields[FIELDS.nomeProjeto]            ?? "",
      descricao:              data.fields[FIELDS.descricao]              ?? "",
      categoria:              data.fields[FIELDS.categoria]              ?? "",
      localizacao:            data.fields[FIELDS.localizacao]            ?? "",
      voluntariosNecessarios: data.fields[FIELDS.voluntariosNecessarios] ?? 0,
      nomeResponsavel:        data.fields[FIELDS.nomeResponsavel]        ?? "",
      email:                  data.fields[FIELDS.email]                  ?? "",
      telefone:               data.fields[FIELDS.telefone]               ?? "",
      entidadeId:             entId ?? "",
      entidade:               entId ? (entidadeNome || entId) : "",
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id }  = await params;
  const apiKey  = process.env.AIRTABLE_API_KEY;
  const baseId  = process.env.AIRTABLE_BASE_ID;
  const table   = process.env.AIRTABLE_TABLE_PROJETOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao excluir." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
