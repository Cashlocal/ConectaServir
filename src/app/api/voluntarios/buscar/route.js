import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const telefone = (searchParams.get("telefone") ?? "").trim().replace(/\D/g, "");

  if (!telefone) {
    return NextResponse.json({ error: "Informe o telefone." }, { status: 400 });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

  if (!apiKey || !baseId || !table) return NextResponse.json(null);

  try {
    // Busca todos os ativos e filtra pelo telefone no servidor
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent("{Status}='Ativo'")}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!res.ok) return NextResponse.json(null);

    const data    = await res.json();
    const records = data.records ?? [];

    const found = records.find((r) => {
      const t = (r.fields["Telefone"] ?? "").replace(/\D/g, "");
      return t === telefone;
    });

    if (!found) return NextResponse.json(null);

    return NextResponse.json({
      id:       found.id,
      nome:     found.fields["Nome Completo"] ?? "",
      email:    found.fields["Email"]         ?? "",
      telefone: found.fields["Telefone"]      ?? "",
    });
  } catch {
    return NextResponse.json(null);
  }
}
