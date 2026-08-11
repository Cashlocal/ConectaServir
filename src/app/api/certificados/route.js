import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_CERTIFICADOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json([]);
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?sort[0][field]=Voluntario&sort[0][direction]=asc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const records = (data.records ?? []).map((r) => {
      const anexos = r.fields["Certificado gerado"];
      const arquivoUrl = Array.isArray(anexos) && anexos.length > 0
        ? anexos[0].url
        : null;
      return {
        id: r.id,
        voluntario: r.fields["Voluntario"] ?? "",
        qtdeHoras: r.fields["Qtde Horas"] ?? 0,
        atividade: r.fields["Atividade"] ?? "",
        status: r.fields["Status"] ?? "Pendente",
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
    const { voluntario, qtdeHoras, atividade } = await req.json();

    if (!voluntario || !qtdeHoras || !atividade) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_CERTIFICADOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta." },
        { status: 500 }
      );
    }

    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Voluntario: voluntario,
          "Qtde Horas": Number(qtdeHoras),
          Atividade: atividade,
          Status: "Pendente",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? "Erro ao salvar." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erro inesperado. Tente novamente." },
      { status: 500 }
    );
  }
}
