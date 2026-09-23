import { NextResponse } from "next/server";

function mapUser(r) {
  const fotoArr = r.fields["foto"];
  return {
    id:           r.id,
    nome:         r.fields["nome"]          ?? "",
    email:        r.fields["email"]         ?? "",
    senha:        r.fields["Senha"]         ?? "",
    clube:        r.fields["Clube"]         ?? "",
    tipo:         r.fields["Tipo"]          ?? "",
    cnpjEntidade: r.fields["CNPJ Entidade"] ?? "",
    status:       r.fields["Status"]        ?? "Ativo",
    foto:         Array.isArray(fotoArr) ? (fotoArr[0]?.url ?? null) : null,
  };
}

export async function PATCH(req, { params }) {
  const { id }  = await params;
  const apiKey  = process.env.AIRTABLE_API_KEY;
  const baseId  = process.env.AIRTABLE_BASE_ID;
  const table   = process.env.AIRTABLE_TABLE_USUARIOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  try {
    const { nome, email, senha, clube, tipo, cnpjEntidade, status, fotoUrl } = await req.json();

    const fields = {};
    if (nome         !== undefined) fields["nome"]          = nome;
    if (email        !== undefined) fields["email"]         = email;
    if (senha        !== undefined) fields["Senha"]         = senha;
    if (clube        !== undefined) fields["Clube"]         = clube;
    if (tipo         !== undefined) fields["Tipo"]          = tipo;
    if (cnpjEntidade !== undefined) fields["CNPJ Entidade"] = cnpjEntidade;
    if (status       !== undefined) fields["Status"]        = status;
    if (fotoUrl      !== undefined) {
      fields["foto"] = fotoUrl ? [{ url: fotoUrl }] : [];
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`,
      {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ fields }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao atualizar." },
        { status: res.status }
      );
    }

    return NextResponse.json(mapUser(data));
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id }  = await params;
  const apiKey  = process.env.AIRTABLE_API_KEY;
  const baseId  = process.env.AIRTABLE_BASE_ID;
  const table   = process.env.AIRTABLE_TABLE_USUARIOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao excluir." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
