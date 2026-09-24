import { NextResponse } from "next/server";

export async function GET(req) {
  const apiKey    = process.env.AIRTABLE_API_KEY;
  const baseId    = process.env.AIRTABLE_BASE_ID;
  const table     = process.env.AIRTABLE_TABLE_VOLUNTARIOS;
  const tableProj = process.env.AIRTABLE_TABLE_PROJETOS;

  if (!apiKey || !baseId || !table) return NextResponse.json([]);

  try {
    const { searchParams } = new URL(req.url);
    const cnpjEntidade = searchParams.get("cnpjEntidade") ?? "";

    const params = new URLSearchParams();
    params.append("fields[]", "Nome Completo");
    params.append("fields[]", "Email");
    params.append("fields[]", "Telefone");
    params.append("fields[]", "Status");
    params.append("fields[]", "Localização");
    params.append("fields[]", "Sobre Você");
    params.append("fields[]", "Habilidades");
    params.append("fields[]", "Disponibilidade");
    params.append("fields[]", "Áreas de Interesse");
    params.append("sort[0][field]", "Nome Completo");
    params.append("sort[0][direction]", "asc");

    if (cnpjEntidade && tableProj) {
      // Estratégia: busca os projetos da entidade → coleta IDs dos voluntários vinculados
      // (mais confiável do que um campo "CNPJ Entidade" no voluntário que pode não existir)
      const digits   = cnpjEntidade.replace(/\D/g, "");
      const projUrl  = new URL(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableProj)}`
      );
      projUrl.searchParams.append(
        "filterByFormula",
        `FIND("${digits}",SUBSTITUTE(ARRAYJOIN({CNPJ Entidade},""),"-",""))>0`
      );
      projUrl.searchParams.append("fields[]", "Voluntários");

      const projRes = await fetch(projUrl.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store",
      });

      if (!projRes.ok) return NextResponse.json([]);

      const projData = await projRes.json();
      const volIds   = (projData.records ?? []).flatMap((p) =>
        Array.isArray(p.fields["Voluntários"]) ? p.fields["Voluntários"] : []
      );
      const uniqueIds = [...new Set(volIds)];

      if (uniqueIds.length === 0) return NextResponse.json([]);

      // Filtra voluntários por RECORD_ID() — sempre confiável
      params.append(
        "filterByFormula",
        `OR(${uniqueIds.map((id) => `RECORD_ID()="${id}"`).join(",")})`
      );
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${params}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const voluntarios = (data.records ?? []).map((r) => ({
      id:              r.id,
      nome:            r.fields["Nome Completo"]      ?? "",
      email:           r.fields["Email"]              ?? "",
      telefone:        r.fields["Telefone"]           ?? "",
      status:          r.fields["Status"]             ?? "Ativo",
      localizacao:     r.fields["Localização"]        ?? "",
      sobreVoce:       r.fields["Sobre Você"]         ?? "",
      habilidades:     r.fields["Habilidades"]        ?? "",
      disponibilidade: r.fields["Disponibilidade"]    ?? "",
      areasInteresse:  Array.isArray(r.fields["Áreas de Interesse"])
                         ? r.fields["Áreas de Interesse"]
                         : [],
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
    const { nome, email, telefone, nomeEntidade, cnpjEntidade } = await req.json();
    if (!nome?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Nome e email são obrigatórios." }, { status: 400 });
    }

    const fields = {
      "Nome Completo": nome.trim(),
      "Email":         email.trim(),
      "Telefone":      (telefone ?? "").trim(),
      "Status":        "Ativo",
    };
    if (nomeEntidade) fields["Nome Entidade"] = nomeEntidade.trim();
    if (cnpjEntidade) fields["CNPJ Entidade"] = cnpjEntidade.trim();

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
