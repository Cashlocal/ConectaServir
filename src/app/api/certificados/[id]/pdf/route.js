import { gerarCertificadoPdf } from "@/lib/gerarCertificadoPdf";

export const runtime = "nodejs";

export async function GET(_req, { params }) {
  const { id: recordId } = await params;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_CERTIFICADOS;

  if (!apiKey || !baseId || !table || !recordId) {
    return new Response("Configuração incompleta.", { status: 500 });
  }

  try {
    const recRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!recRes.ok) {
      return new Response("Registro não encontrado.", { status: 404 });
    }

    const rec = await recRes.json();
    const voluntario  = rec.fields["Voluntario"] ?? "";
    const qtdeHoras   = rec.fields["Qtde Horas"] ?? 0;
    const atividade   = rec.fields["Atividade"] ?? "";
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const pdfBuffer = await gerarCertificadoPdf({ voluntario, qtdeHoras, atividade, dataEmissao });
    const filename = `certificado-${voluntario.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("Erro ao gerar PDF:", err);
    return new Response("Erro ao gerar o PDF.", { status: 500 });
  }
}
