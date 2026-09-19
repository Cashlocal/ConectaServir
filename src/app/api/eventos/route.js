import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_EVENTOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json({ error: true, records: [] });
    }

    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`
    );
    url.searchParams.set("sort[0][field]", "Data");
    url.searchParams.set("sort[0][direction]", "asc");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: true, records: [] });
    }

    const data = await res.json();
    const records = (data.records || []).map((r) => ({
      id: r.id,
      nome: r.fields["Nome Evento"] ?? "",
      descricao: r.fields["Descrição"] ?? "",
      data: r.fields["Data"] ?? null,
    }));

    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: true, records: [] });
  }
}

export async function POST(req) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_EVENTOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  try {
    const { nome, descricao, data } = await req.json();

    if (!nome?.trim()) {
      return NextResponse.json({ error: "O campo Nome Evento é obrigatório." }, { status: 400 });
    }

    const fields = { "Nome Evento": nome.trim() };
    if (descricao !== undefined) fields["Descrição"] = descricao.trim();
    if (data) fields["Data"] = data;

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: result?.error?.message ?? "Erro ao criar evento." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id: result.id,
      nome: result.fields["Nome Evento"] ?? "",
      descricao: result.fields["Descrição"] ?? "",
      data: result.fields["Data"] ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
