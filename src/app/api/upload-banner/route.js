import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    }
    const blob = await put(file.name, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("upload-banner error:", err);
    return NextResponse.json({ error: "Erro ao fazer upload." }, { status: 500 });
  }
}
