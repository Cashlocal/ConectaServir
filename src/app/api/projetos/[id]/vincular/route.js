import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { id }   = await params;
  const apiKey   = process.env.AIRTABLE_API_KEY;
  const baseId   = process.env.AIRTABLE_BASE_ID;
  const tabProj  = process.env.AIRTABLE_TABLE_PROJETOS;

  if (!apiKey || !baseId || !tabProj) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  try {
    const { voluntarioId } = await req.json();
    if (!voluntarioId) return NextResponse.json({ error: "voluntarioId obrigatório." }, { status: 400 });

    // Busca voluntários já vinculados ao projeto para não sobrescrever
    const getRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tabProj)}/${id}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!getRes.ok) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

    const projeto  = await getRes.json();
    const atuais   = projeto.fields["Voluntários"] ?? [];
    const jaVinc   = Array.isArray(atuais) ? atuais : [];

    if (jaVinc.includes(voluntarioId)) {
      return NextResponse.json({ ok: true, jaVinculado: true });
    }

    const novaLista = [...jaVinc, voluntarioId];

    const patchRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tabProj)}/${id}`,
      {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ fields: { "Voluntários": novaLista } }),
      }
    );

    if (!patchRes.ok) {
      const d = await patchRes.json().catch(() => ({}));
      return NextResponse.json({ error: d?.error?.message ?? "Erro ao vincular." }, { status: patchRes.status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
