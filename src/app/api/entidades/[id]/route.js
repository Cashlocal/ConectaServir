import { NextResponse } from "next/server";

const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

export async function PATCH(req, { params }) {
  const { id } = await params;
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
      `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${id}`,
      {
        method: "PATCH",
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
        { error: data?.error?.message ?? "Erro ao atualizar entidade." },
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

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao excluir entidade." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
