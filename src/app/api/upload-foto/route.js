import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WEBHOOK_URL = "https://integrador.cashlocal.com.br/webhook/d389716c-008a-4f74-b3c5-69380a4eb7ad";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido. Use JPG, PNG ou WEBP." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64      = Buffer.from(arrayBuffer).toString("base64");
    const mimeType    = file.type || "image/jpeg";
    const filename    = file.name || "foto.jpg";

    const webhookRes = await fetch(WEBHOOK_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ base64, mimeType, filename }),
    });

    if (!webhookRes.ok) {
      const txt = await webhookRes.text().catch(() => "");
      return NextResponse.json({ error: `Webhook retornou erro: ${webhookRes.status} ${txt}` }, { status: 502 });
    }

    const result = await webhookRes.json().catch(() => null);

    let url = null;
    if (result) {
      url = result.url ?? result.fileUrl ?? result.publicUrl
        ?? result.data?.url ?? result.data?.fileUrl
        ?? (Array.isArray(result) ? (result[0]?.url ?? result[0]?.fileUrl) : null);
    }

    if (!url) {
      return NextResponse.json({ error: "Webhook não retornou a URL do arquivo." }, { status: 502 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
