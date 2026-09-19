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
      id:       r.id,
      nome:     r.fields["Nome"]      ?? "",
      descricao:r.fields["Descricao"] ?? "",
      telefone: r.fields["Telefone"]  ?? "",
      email:    r.fields["Email"]     ?? "",
    }));

    return NextResponse.json(entidades);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    const { nome, descricao, telefone, email } = await req.json();
    if (!nome?.trim()) {
      return NextResponse.json({ error: "O campo Nome é obrigatório." }, { status: 400 });
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            Nome:      nome.trim(),
            Descricao: (descricao ?? "").trim(),
            Telefone:  (telefone  ?? "").trim(),
            Email:     (email     ?? "").trim(),
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao criar entidade." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id:       data.id,
      nome:     data.fields["Nome"]      ?? "",
      descricao:data.fields["Descricao"] ?? "",
      telefone: data.fields["Telefone"]  ?? "",
      email:    data.fields["Email"]     ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
