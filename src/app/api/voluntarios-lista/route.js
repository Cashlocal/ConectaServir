import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json([]);
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = await res.json();
    const records = (data.records ?? [])
      .map((r) => ({
        id: r.id,
        nome: r.fields["Nome Completo"] ?? "",
      }))
      .filter((r) => r.nome)
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return NextResponse.json(records);
  } catch {
    return NextResponse.json([]);
  }
}
