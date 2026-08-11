import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { ok: false, message: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_TABLE_USUARIOS;

    if (!apiKey || !baseId || !table) {
      return NextResponse.json(
        { ok: false, message: "Configuração do servidor incompleta." },
        { status: 500 }
      );
    }

    const filter = encodeURIComponent(`{email}="${email}"`);
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?filterByFormula=${filter}&maxRecords=1`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: "Erro ao consultar o servidor." },
        { status: 502 }
      );
    }

    const data = await res.json();
    const record = data.records?.[0];

    if (!record) {
      return NextResponse.json(
        { ok: false, message: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const senhaAirtable = record.fields["Senha"] ?? "";
    if (String(senhaAirtable) !== String(senha)) {
      return NextResponse.json(
        { ok: false, message: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const fotoArr = record.fields["foto"];
    const foto = Array.isArray(fotoArr) ? fotoArr[0]?.url ?? null : null;

    return NextResponse.json({
      ok: true,
      user: {
        id: record.id,
        nome: record.fields["nome"] ?? "",
        email: record.fields["email"] ?? email,
        foto,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Erro inesperado. Tente novamente." },
      { status: 500 }
    );
  }
}
