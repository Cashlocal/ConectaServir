import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_EVENTOS;
  const { id } = await params;

  if (!apiKey || !baseId || !table || !id) {
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  try {
    const { nome, descricao, data, bannerUrl, entidadeId } = await req.json();

    const fields = {};
    if (nome       !== undefined) fields["Nome Evento"] = nome.trim();
    if (descricao  !== undefined) fields["Descrição"]   = descricao.trim();
    if (data       !== undefined) fields["Data"]        = data || null;
    if (bannerUrl  !== undefined) fields["Banner"]      = bannerUrl ? [{ url: bannerUrl }] : [];
    if (entidadeId !== undefined) fields["Entidade"]    = entidadeId ? [entidadeId] : [];

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: result?.error?.message ?? "Erro ao atualizar evento." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id: result.id,
      nome: result.fields["Nome Evento"] ?? "",
      descricao: result.fields["Descrição"] ?? "",
      data: result.fields["Data"] ?? null,
      banner: result.fields["Banner"]?.[0]?.url ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_EVENTOS;
  const { id } = await params;

  if (!apiKey || !baseId || !table || !id) {
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      const result = await res.json();
      return NextResponse.json(
        { error: result?.error?.message ?? "Erro ao excluir evento." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
