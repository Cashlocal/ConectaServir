import { NextResponse }          from "next/server";
import { gerarCertificadoPdf }  from "@/lib/gerarCertificadoPdf";

export const runtime = "nodejs";

const WEBHOOK_URL       = "https://integrador.cashlocal.com.br/webhook/d1be98bc-923e-4dcf-ae5a-974ef17932e8";
const TABLE_ENTIDADES   = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

async function airtableGet(apiKey, url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(req, { params }) {
  const { id: recordId } = await params;

  const apiKey   = process.env.AIRTABLE_API_KEY;
  const baseId   = process.env.AIRTABLE_BASE_ID;
  const table    = process.env.AIRTABLE_TABLE_CERTIFICADOS;
  const tableVol = process.env.AIRTABLE_TABLE_VOLUNTARIOS;

  if (!apiKey || !baseId || !table || !tableVol) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    // 1. Busca registro do certificado
    const rec = await airtableGet(
      apiKey,
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`
    );
    if (!rec) return NextResponse.json({ error: "Certificado não encontrado." }, { status: 404 });

    // Aceita qtdeHoras via body para salvar antes de gerar o PDF
    let qtdeHoras = rec.fields["Qtde Horas"] ?? 0;
    let horasBody = null;
    try { const b = await req.json(); horasBody = b?.qtdeHoras; } catch {}
    if (horasBody !== null && horasBody !== undefined) {
      qtdeHoras = Number(horasBody) || 0;
      // Salva as horas no Airtable antes de tudo
      await fetch(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
        {
          method:  "PATCH",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body:    JSON.stringify({ fields: { "Qtde Horas": qtdeHoras } }),
        }
      ).catch(() => {});
    }

    const atividade = rec.fields["Atividade"]  ?? "";
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // 2. Resolve voluntário (linked record → nome + email)
    const voluntarioIds = rec.fields["Voluntario"];
    const voluntarioId  = Array.isArray(voluntarioIds) ? voluntarioIds[0] : null;
    let voluntarioNome = "", voluntarioEmail = "";
    if (voluntarioId) {
      const volRec = await airtableGet(
        apiKey,
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableVol)}/${voluntarioId}`
      );
      voluntarioNome  = volRec?.fields?.["Nome Completo"] ?? "";
      voluntarioEmail = volRec?.fields?.["Email"]         ?? "";
    }

    // 3. Resolve entidade (linked record → nome)
    const entidadeIds = rec.fields["Entidade"];
    const entidadeId  = Array.isArray(entidadeIds) ? entidadeIds[0] : null;
    let entidadeNome = "";
    if (entidadeId) {
      const entRec = await airtableGet(
        apiKey,
        `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${entidadeId}`
      );
      entidadeNome = entRec?.fields?.["Nome"] ?? "";
    }

    // 4. Gera PDF e converte para base64
    const pdfBuffer = await gerarCertificadoPdf({
      voluntario: voluntarioNome,
      qtdeHoras,
      atividade,
      entidade: entidadeNome,
      dataEmissao,
    });
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // URL permanente do PDF
    const host   = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const proto  = req.headers.get("x-forwarded-proto") ?? "https";
    const pdfUrl = `${proto}://${host}/api/certificados/${recordId}/pdf`;

    // 5. Envia para o webhook
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:    voluntarioEmail,
        nome:     voluntarioNome,
        entidade: entidadeNome,
        horas:    qtdeHoras,
        atividade,
        pdfBase64,
        pdfUrl,
        filename: `certificado-${voluntarioNome.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      }),
    });

    if (!webhookRes.ok) {
      const txt = await webhookRes.text().catch(() => "");
      console.error("Webhook error:", webhookRes.status, txt);
      return NextResponse.json(
        { error: `Erro ao acionar o envio de email (${webhookRes.status}).` },
        { status: 502 }
      );
    }

    // Atualiza status para "Emitido" e salva URL do PDF no Airtable
    await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      {
        method:  "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          fields: {
            Status: "Emitido",
            "Certificado gerado": [{ url: pdfUrl, filename: `certificado-${recordId}.pdf` }],
          },
        }),
      }
    ).catch(() => {});

    return NextResponse.json({ success: true, arquivoUrl: pdfUrl });
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return NextResponse.json({ error: "Erro inesperado ao enviar o email." }, { status: 500 });
  }
}
