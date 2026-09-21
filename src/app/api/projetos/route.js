import { NextResponse } from "next/server";

const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

const FIELDS = {
  nomeProjeto:            "Nome do Projeto",
  descricao:              "Descrição",
  categoria:              "Categoria",
  localizacao:            "Localização",
  voluntariosNecessarios: "Voluntários Necessários",
  nomeResponsavel:        "Nome Responsável",
  email:                  "Email",
  telefone:               "Telefone",
  entidade:               "Entidade",
};

function mapRecord(r, entMap) {
  const entIds = r.fields[FIELDS.entidade];
  const entId  = Array.isArray(entIds) ? entIds[0] : null;
  return {
    id:                     r.id,
    nomeProjeto:            r.fields[FIELDS.nomeProjeto]            ?? "",
    descricao:              r.fields[FIELDS.descricao]              ?? "",
    categoria:              r.fields[FIELDS.categoria]              ?? "",
    localizacao:            r.fields[FIELDS.localizacao]            ?? "",
    voluntariosNecessarios: r.fields[FIELDS.voluntariosNecessarios] ?? 0,
    nomeResponsavel:        r.fields[FIELDS.nomeResponsavel]        ?? "",
    email:                  r.fields[FIELDS.email]                  ?? "",
    telefone:               r.fields[FIELDS.telefone]               ?? "",
    entidadeId:             entId ?? "",
    entidade:               entId ? (entMap[entId] ?? "") : "",
  };
}

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_PROJETOS;

  if (!apiKey || !baseId || !table) return NextResponse.json([]);

  try {
    const params = new URLSearchParams();
    params.append("sort[0][field]",     FIELDS.nomeProjeto);
    params.append("sort[0][direction]", "asc");

    const entParams = new URLSearchParams();
    entParams.append("fields[]", "Nome");

    const [projRes, entRes] = await Promise.all([
      fetch(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
      fetch(
        `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}?${entParams}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
    ]);

    if (!projRes.ok) return NextResponse.json([]);

    const entMap = {};
    if (entRes.ok) {
      const ed = await entRes.json();
      for (const r of ed.records ?? []) {
        entMap[r.id] = r.fields["Nome"] ?? "";
      }
    }

    const data    = await projRes.json();
    const projetos = (data.records ?? []).map((r) => mapRecord(r, entMap));
    return NextResponse.json(projetos);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request) {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_TABLE_PROJETOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
    }

    const {
      nomeProjeto, descricao, categoria, localizacao,
      voluntariosNecessarios, nomeResponsavel, email, telefone, entidadeId,
    } = await request.json();

    if (!nomeProjeto?.trim() || !descricao?.trim() || !categoria?.trim()) {
      return NextResponse.json({ error: "Preencha os campos obrigatórios." }, { status: 400 });
    }

    const num    = Number(voluntariosNecessarios);
    const fields = {
      [FIELDS.nomeProjeto]:            nomeProjeto.trim(),
      [FIELDS.descricao]:              descricao.trim(),
      [FIELDS.categoria]:              categoria.trim(),
      [FIELDS.localizacao]:            (localizacao ?? "").trim(),
      [FIELDS.voluntariosNecessarios]: Number.isFinite(num) ? num : 0,
      [FIELDS.nomeResponsavel]:        (nomeResponsavel ?? "").trim(),
      [FIELDS.email]:                  (email ?? "").trim(),
      [FIELDS.telefone]:               (telefone ?? "").trim(),
    };
    if (entidadeId) fields[FIELDS.entidade] = [entidadeId];

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Não foi possível salvar." },
        { status: res.status }
      );
    }

    // Resolve entidade name for response
    let entidadeNome = "";
    if (entidadeId) {
      try {
        const er = await fetch(
          `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${entidadeId}`,
          { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
        );
        if (er.ok) { const ed = await er.json(); entidadeNome = ed.fields?.["Nome"] ?? ""; }
      } catch {}
    }

    return NextResponse.json({ ...mapRecord(data, { [entidadeId]: entidadeNome }), success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro inesperado." }, { status: 500 });
  }
}
