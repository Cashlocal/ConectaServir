import { NextResponse } from "next/server";
import { gerarCertificadoPdf } from "@/lib/gerarCertificadoPdf";

export const runtime = "nodejs";

export async function POST(req, { params }) {
  const { id: recordId } = await params;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_CERTIFICADOS;

  if (!apiKey || !baseId || !table || !recordId) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 500 });
  }

  try {
    // 1. Buscar dados do registro
    const recRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!recRes.ok) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }
    const rec = await recRes.json();
    const voluntario  = rec.fields["Voluntario"] ?? "";
    const qtdeHoras   = rec.fields["Qtde Horas"] ?? 0;
    const atividade   = rec.fields["Atividade"] ?? "";
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // 2. Gerar PDF (valida que funciona antes de salvar)
    const pdfBuffer = await gerarCertificadoPdf({ voluntario, qtdeHoras, atividade, dataEmissao });
    const filename = `certificado-${voluntario.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    // 3. Determinar a URL pública do endpoint de PDF
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const pdfUrl = `${proto}://${host}/api/certificados/${recordId}/pdf`;

    // 4. PATCH no Airtable: salva a URL do PDF no campo de anexo e muda status
    //    O Airtable baixa e armazena o arquivo automaticamente ao receber a URL
    const patchRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Certificado gerado": [{ url: pdfUrl, filename }],
            Status: "Emitido",
          },
        }),
      }
    );

    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => "");
      console.error("Airtable PATCH error:", patchRes.status, errText);
      return NextResponse.json(
        { error: `Erro ao salvar no servidor (${patchRes.status}).` },
        { status: 502 }
      );
    }

    // 5. Se o Airtable não armazenou o arquivo via URL (campo ainda vazio),
    //    retornar o buffer para o cliente salvar via download direto
    const patchData = await patchRes.json();
    const anexos = patchData.fields?.["Certificado gerado"];
    const arquivoSalvo = Array.isArray(anexos) && anexos.length > 0;

    return NextResponse.json({
      success: true,
      arquivoSalvo,
      // Retorna o PDF em base64 para fallback de download no cliente
      pdfBase64: arquivoSalvo ? null : Buffer.from(pdfBuffer).toString("base64"),
      filename,
    });
  } catch (err) {
    console.error("Erro ao gerar certificado:", err);
    return NextResponse.json({ error: "Erro inesperado ao gerar o certificado." }, { status: 500 });
  }
}
