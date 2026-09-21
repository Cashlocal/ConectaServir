import { NextResponse } from "next/server";

function mapUser(r) {
  const fotoArr = r.fields["foto"];
  return {
    id:     r.id,
    nome:   r.fields["nome"]   ?? "",
    email:  r.fields["email"]  ?? "",
    senha:  r.fields["Senha"]  ?? "",
    clube:  r.fields["Clube"]  ?? "",
    status: r.fields["Status"] ?? "Ativo",
    foto:   Array.isArray(fotoArr) ? (fotoArr[0]?.url ?? null) : null,
  };
}

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_USUARIOS;

  if (!apiKey || !baseId || !table) return NextResponse.json([]);

  try {
    const params = new URLSearchParams();
    params.append("sort[0][field]",     "nome");
    params.append("sort[0][direction]", "asc");

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    return NextResponse.json((data.records ?? []).map(mapUser));
  } catch {
    return NextResponse.json([]);
  }
}
