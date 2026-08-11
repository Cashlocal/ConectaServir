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

    // Busca todos os registros e filtra no servidor para evitar
    // problemas de encoding do @ na filterByFormula do Airtable
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

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
    const records = data.records ?? [];

    const emailNorm = email.trim().toLowerCase();
    const record = records.find(
      (r) =>
        typeof r.fields["email"] === "string" &&
        r.fields["email"].trim().toLowerCase() === emailNorm
    );

    if (!record) {
      return NextResponse.json(
        { ok: false, message: "Usuário e senha inválidos." },
        { status: 401 }
      );
    }

    const senhaAirtable = String(record.fields["Senha"] ?? "").trim();
    if (senhaAirtable !== String(senha).trim()) {
      return NextResponse.json(
        { ok: false, message: "Usuário e senha inválidos." },
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
