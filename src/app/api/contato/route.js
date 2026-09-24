import { NextResponse } from "next/server";

const WEBHOOK_URL =
  "https://integrador.cashlocal.com.br/webhook/d1be98bc-923e-4dcf-ae5a-974ef17932e9";

export async function POST(req) {
  try {
    const { nome, email, mensagem } = await req.json();

    if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const payload = {
      nome:     nome.trim(),
      email:    email.trim(),
      mensagem: mensagem.trim(),
    };

    const hookRes = await fetch(WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!hookRes.ok) {
      return NextResponse.json(
        { error: "Não foi possível registrar a mensagem. Tente novamente." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
