import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WEBHOOK_URL =
  "https://integrador.cashlocal.com.br/webhook/d389716c-008a-4f74-b3c5-69380a4eb7ad";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/jpeg";
    const filename = file.name || "banner.jpg";

    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mimeType, filename }),
    });

    if (!webhookRes.ok) {
      const txt = await webhookRes.text().catch(() => "");
      console.error("Webhook error:", webhookRes.status, txt);
      return NextResponse.json({ error: "Erro ao processar imagem." }, { status: 502 });
    }

    const result = await webhookRes.json();
    const url = result?.url ?? result?.[0]?.url ?? null;
    if (!url) {
      return NextResponse.json({ error: "URL não retornada pelo serviço." }, { status: 502 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("upload-banner error:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
