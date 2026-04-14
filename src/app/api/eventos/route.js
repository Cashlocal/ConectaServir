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
