import { NextResponse } from "next/server";

const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) return NextResponse.json([]);

  try {
    const url = `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}?sort[0][field]=Nome&sort[0][direction]=asc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const entidades = (data.records ?? []).map((r) => ({
      id: r.id,
      nome: r.fields["Nome"] ?? "",
    }));

    return NextResponse.json(entidades);
  } catch {
    return NextResponse.json([]);
  }
}
