import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const { id } = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const fields = {};

    if (body.nome     !== undefined) fields["Nome Completo"] = body.nome.trim();
    if (body.email    !== undefined) fields["Email"]         = body.email.trim();
    if (body.telefone !== undefined) fields["Telefone"]      = (body.telefone ?? "").trim();
    if (body.status   !== undefined) fields["Status"]        = body.status; // "Ativo" | "Inativo"

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
    }

    if (fields["Nome Completo"] !== undefined && !fields["Nome Completo"]) {
      return NextResponse.json({ error: "O campo Nome é obrigatório." }, { status: 400 });
    }

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
        { error: data?.error?.message ?? "Erro ao atualizar voluntário." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id:       data.id,
      nome:     data.fields["Nome Completo"] ?? "",
      email:    data.fields["Email"]         ?? "",
      telefone: data.fields["Telefone"]      ?? "",
      status:   data.fields["Status"]        ?? "Ativo",
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
