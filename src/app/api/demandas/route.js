import { NextResponse } from "next/server";

const TABLE_DEMANDAS  = process.env.AIRTABLE_TABLE_DEMANDAS  ?? "tblLRhJg6DgfZ2g8G";
const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) return NextResponse.json([]);

  try {
    // Busca demandas e entidades em paralelo para resolver linked records
    const entParams = new URLSearchParams();
    entParams.append("fields[]", "Nome");

    const [demRes, entRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${baseId}/${TABLE_DEMANDAS}?sort[0][field]=Name&sort[0][direction]=asc`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
      fetch(
        `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}?${entParams}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
    ]);

    if (!demRes.ok) return NextResponse.json([]);

    // Mapa id → nome das entidades
    const entMap = {};
    if (entRes.ok) {
      const ed = await entRes.json();
      for (const r of ed.records ?? []) {
        entMap[r.id] = r.fields["Nome"] ?? "";
      }
    }

    const demData = await demRes.json();
    const demandas = (demData.records ?? []).map((r) => {
      const entidadeIds = r.fields["Entidade"];
      const entidadeId  = Array.isArray(entidadeIds) ? entidadeIds[0] : null;

      return {
        id:          r.id,
        nome:        r.fields["Name"]     ?? r.fields["Nome"] ?? "",
        descricao:   r.fields["Descicao"] ?? r.fields["Descricao"] ?? "",
        entidadeId:  entidadeId ?? "",
        entidade:    entidadeId ? (entMap[entidadeId] ?? "") : "",
        status:      r.fields["Status"]   ?? "Em Aberto",
      };
    });

    return NextResponse.json(demandas);
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
    const { nome, descricao, entidadeId, status } = await req.json();
    if (!nome?.trim()) {
      return NextResponse.json({ error: "O campo Nome é obrigatório." }, { status: 400 });
    }

    const fields = {
      Name:     nome.trim(),
      Descicao: (descricao ?? "").trim(),
      Status:   status ?? "Em Aberto",
    };
    if (entidadeId) fields["Entidade"] = [entidadeId];

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_DEMANDAS}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao criar demanda." },
        { status: res.status }
      );
    }

    // Resolve entidade name para retornar no response
    let entidadeNome = "";
    if (entidadeId) {
      try {
        const eRes = await fetch(
          `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${entidadeId}`,
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
      entidadeId: entidadeId ?? "",
      entidade:   entidadeNome,
      status:     data.fields["Status"]   ?? "Em Aberto",
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
