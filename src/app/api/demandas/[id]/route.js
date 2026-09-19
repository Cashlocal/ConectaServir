import { NextResponse } from "next/server";

const TABLE_DEMANDAS  = process.env.AIRTABLE_TABLE_DEMANDAS  ?? "tblLRhJg6DgfZ2g8G";
const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

export async function PATCH(req, { params }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const { id } = await params;

  if (!apiKey || !baseId || !id) {
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  try {
    const { nome, descricao, entidadeId, status } = await req.json();

    const fields = {};
    if (nome !== undefined)      fields["Name"]     = nome.trim();
    if (descricao !== undefined) fields["Descicao"] = descricao.trim();
    if (status !== undefined)    fields["Status"]   = status;
    if (entidadeId !== undefined) {
      fields["Entidade"] = entidadeId ? [entidadeId] : [];
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_DEMANDAS}/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao atualizar demanda." },
        { status: res.status }
      );
    }

    // Resolve entidade name
    const resolvedEntidadeId = Array.isArray(data.fields["Entidade"])
      ? data.fields["Entidade"][0]
      : entidadeId ?? "";
    let entidadeNome = "";
    if (resolvedEntidadeId) {
      try {
        const eRes = await fetch(
          `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${resolvedEntidadeId}`,
          { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
        );
        if (eRes.ok) {
          const eData = await eRes.json();
          entidadeNome = eData.fields?.["Nome"] ?? "";
        }
      } catch {}
    }

    return NextResponse.json({
      id:         data.id,
      nome:       data.fields["Name"]     ?? data.fields["Nome"] ?? "",
      descricao:  data.fields["Descicao"] ?? "",
      entidadeId: resolvedEntidadeId,
      entidade:   entidadeNome,
      status:     data.fields["Status"]   ?? "Em Aberto",
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const { id } = await params;

  if (!apiKey || !baseId || !id) {
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_DEMANDAS}/${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao excluir demanda." },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
