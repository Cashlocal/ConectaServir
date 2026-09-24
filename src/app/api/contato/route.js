import { NextResponse } from "next/server";

const WEBHOOK_URL = process.env.CONTACT_WEBHOOK_URL ?? "";

export async function POST(req) {
  try {
    const { nome, email, mensagem } = await req.json();

    if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "contato",
          nome:     nome.trim(),
          email:    email.trim(),
          mensagem: mensagem.trim(),
          data:     new Date().toISOString(),
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
