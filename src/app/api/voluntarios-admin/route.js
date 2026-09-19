import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

  if (!apiKey || !baseId || !table) return NextResponse.json([]);

  try {
    const params = new URLSearchParams();
    params.append("fields[]", "Nome Completo");
    params.append("fields[]", "Email");
    params.append("fields[]", "Telefone");
    params.append("fields[]", "Status");
    params.append("sort[0][field]", "Nome Completo");
    params.append("sort[0][direction]", "asc");

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const voluntarios = (data.records ?? []).map((r) => ({
      id:       r.id,
      nome:     r.fields["Nome Completo"] ?? "",
      email:    r.fields["Email"]         ?? "",
      telefone: r.fields["Telefone"]      ?? "",
      status:   r.fields["Status"]        ?? "Ativo",
    }));

    return NextResponse.json(voluntarios);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    const { nome, email, telefone } = await req.json();
    if (!nome?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e email são obrigatórios." }, { status: 400 });
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            "Nome Completo": nome.trim(),
            "Email":         email.trim(),
            "Telefone":      (telefone ?? "").trim(),
            "Status":        "Ativo",
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao criar voluntário." },
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
