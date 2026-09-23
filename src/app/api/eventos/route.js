import { NextResponse } from "next/server";

const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

function mapEvento(r, entMap) {
  const entIds = r.fields["Entidade"];
  const entId  = Array.isArray(entIds) ? entIds[0] : null;
  const ent    = entId ? (entMap[entId] ?? {}) : {};
  return {
    id:           r.id,
    nome:         r.fields["Nome Evento"]  ?? "",
    descricao:    r.fields["Descrição"]    ?? "",
    data:         r.fields["Data"]         ?? null,
    banner:       r.fields["Banner"]?.[0]?.url ?? null,
    entidadeId:   entId ?? "",
    entidade:     ent.nome ?? "",
    entidadeLogo: ent.logo ?? null,
  };
}

export async function GET(req) {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_EVENTOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json({ error: true, records: [] });
    }

    const { searchParams } = new URL(req.url);
    const entidadeId   = searchParams.get("entidadeId")   ?? "";
    const cnpjEntidade = searchParams.get("cnpjEntidade") ?? "";

    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`
    );
    url.searchParams.set("sort[0][field]", "Data");
    url.searchParams.set("sort[0][direction]", "asc");

    // Filtra por CNPJ Entidade (lookup field) — mais confiável que ID de linked record
    if (cnpjEntidade || entidadeId) {
      const digits = cnpjEntidade
        ? cnpjEntidade.replace(/\D/g, "")
        : entidadeId.replace(/\D/g, "");
      if (digits) {
        url.searchParams.set(
          "filterByFormula",
          `FIND("${digits}",SUBSTITUTE(ARRAYJOIN({CNPJ Entidade},""),"-",""))>0`
        );
      }
    }

    const entParams = new URLSearchParams();
    entParams.append("fields[]", "Nome");
    entParams.append("fields[]", "Logo");

    const [res, entRes] = await Promise.all([
      fetch(url.toString(), { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }),
      fetch(
        `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}?${entParams}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
    ]);

    if (!res.ok) {
      return NextResponse.json({ error: true, records: [] });
    }

    const entMap = {};
    if (entRes.ok) {
      const ed = await entRes.json();
      for (const r of ed.records ?? []) {
        const logoArr = r.fields["Logo"];
        entMap[r.id] = {
          nome: r.fields["Nome"] ?? "",
          logo: Array.isArray(logoArr) ? (logoArr[0]?.url ?? null) : null,
        };
      }
    }

    const data = await res.json();
    const records = (data.records || []).map((r) => mapEvento(r, entMap));

    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: true, records: [] });
  }
}

export async function POST(req) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE_EVENTOS;

  if (!apiKey || !baseId || !table) {
    return NextResponse.json({ error: "Configuração inválida." }, { status: 400 });
  }

  try {
    const { nome, descricao, data, bannerUrl, entidadeId } = await req.json();

    if (!nome?.trim()) {
      return NextResponse.json({ error: "O campo Nome Evento é obrigatório." }, { status: 400 });
    }

    const fields = { "Nome Evento": nome.trim() };
    if (descricao !== undefined) fields["Descrição"] = descricao.trim();
    if (data) fields["Data"] = data;
    if (bannerUrl) fields["Banner"] = [{ url: bannerUrl }];
    if (entidadeId) fields["Entidade"] = [entidadeId];

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const result = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: result?.error?.message ?? "Erro ao criar evento." },
        { status: res.status }
      );
    }

    return NextResponse.json({
      id:           result.id,
      nome:         result.fields["Nome Evento"]  ?? "",
      descricao:    result.fields["Descrição"]    ?? "",
      data:         result.fields["Data"]         ?? null,
      banner:       result.fields["Banner"]?.[0]?.url ?? null,
      entidadeId:   entidadeId ?? "",
      entidade:     "",
      entidadeLogo: null,
    });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
