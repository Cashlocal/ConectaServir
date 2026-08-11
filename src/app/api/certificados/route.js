import { NextResponse } from "next/server";

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
