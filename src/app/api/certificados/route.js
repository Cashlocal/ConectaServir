import { NextResponse } from "next/server";

const TABLE_ENTIDADES = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

export async function GET(req) {
  try {
    const apiKey   = process.env.AIRTABLE_API_KEY;
    const baseId   = process.env.AIRTABLE_BASE_ID;
    const table    = process.env.AIRTABLE_TABLE_CERTIFICADOS;
    const tableVol = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

    if (!apiKey || !baseId || !table) return NextResponse.json([]);

    const { searchParams } = new URL(req.url);
    const voluntarioIdFiltro = searchParams.get("voluntarioId");
    const cnpjEntidade       = searchParams.get("cnpjEntidade") ?? "";

    // Busca certificados, voluntários e entidades em paralelo para resolver linked records
    const volParams = new URLSearchParams();
    volParams.append("fields[]", "Nome Completo");
    volParams.append("fields[]", "Email");

    const entParams = new URLSearchParams();
    entParams.append("fields[]", "Nome");

    const filters = [];
    if (voluntarioIdFiltro) {
      filters.push(`FIND("${voluntarioIdFiltro}",ARRAYJOIN({Voluntario}))>0`);
    }
    if (cnpjEntidade) {
      const digits = cnpjEntidade.replace(/\D/g, "");
      filters.push(`FIND("${digits}",SUBSTITUTE(ARRAYJOIN({CNPJ Entidade},""),"-",""))>0`);
    }
    const filterStr = filters.length === 1 ? filters[0] : filters.length > 1 ? `AND(${filters.join(",")})` : "";

    let certUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?sort[0][field]=Atividade&sort[0][direction]=asc`;
    if (filterStr) {
      certUrl += `&filterByFormula=${encodeURIComponent(filterStr)}`;
    }

    const [certRes, volRes, entRes] = await Promise.all([
      fetch(
        certUrl,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
      tableVol
        ? fetch(
            `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableVol)}?${volParams}`,
            { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
          )
        : Promise.resolve(null),
      fetch(
        `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}?${entParams}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
      ),
    ]);

    if (!certRes.ok) return NextResponse.json([]);

    // Mapa id → { nome, email } para voluntários
    const volMap = {};
    if (volRes && volRes.ok) {
      const vd = await volRes.json();
      for (const r of vd.records ?? []) {
        volMap[r.id] = {
          nome:  r.fields["Nome Completo"] ?? "",
          email: r.fields["Email"]         ?? "",
        };
      }
    }

    // Mapa id → nome para entidades
    const entMap = {};
    if (entRes && entRes.ok) {
      const ed = await entRes.json();
      for (const r of ed.records ?? []) {
        entMap[r.id] = r.fields["Nome"] ?? "";
      }
    }

    const certData = await certRes.json();
    const records  = (certData.records ?? []).map((r) => {
      const anexos     = r.fields["Certificado gerado"];
      const arquivoUrl = Array.isArray(anexos) && anexos.length > 0 ? anexos[0].url : null;

      // Voluntário é linked record → resolve nome e email
      const voluntarioIds = r.fields["Voluntario"];
      const voluntarioId  = Array.isArray(voluntarioIds) ? voluntarioIds[0] : null;
      const volInfo       = voluntarioId ? volMap[voluntarioId] : null;

      // Entidade é linked record → resolve nome
      const entidadeIds = r.fields["Entidade"];
      const entidadeId  = Array.isArray(entidadeIds) ? entidadeIds[0] : null;

      return {
        id:              r.id,
        voluntario:      volInfo?.nome  ?? "",
        voluntarioEmail: volInfo?.email ?? "",
        qtdeHoras:       r.fields["Qtde Horas"] ?? 0,
        atividade:       r.fields["Atividade"]  ?? "",
        entidade:        entidadeId ? (entMap[entidadeId] ?? "") : "",
        status:          r.fields["Status"]     ?? "Pendente",
        arquivoUrl,
      };
    });

    return NextResponse.json(records);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req) {
  try {
    const { voluntarioId, qtdeHoras, atividade, entidadeId } = await req.json();

    if (!voluntarioId || !atividade) {
      return NextResponse.json({ error: "Campos obrigatórios faltando." }, { status: 400 });
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_TABLE_CERTIFICADOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 500 });
    }

    const fields = {
      Voluntario:   [voluntarioId],          // linked record
      "Qtde Horas": Number(qtdeHoras) || 0,
      Atividade:    atividade,
      Status:       "Pendente",
    };

    if (entidadeId) {
      fields["Entidade"] = [entidadeId];
    }

    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? "Erro ao salvar." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado. Tente novamente." }, { status: 500 });
  }
}
