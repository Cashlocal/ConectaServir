import { NextResponse } from "next/server";
import { gerarCertificadoPdf } from "@/lib/gerarCertificadoPdf";

export const runtime = "nodejs";

const TABLE_ENTIDADES  = process.env.AIRTABLE_TABLE_ENTIDADES  ?? "tblPIOP4H76gOOPSe";
const TABLE_VOLUNTARIOS = process.env.AIRTABLE_TABLE_VOLUNTARIOS ?? "";

async function buscarNomeEntidade(apiKey, baseId, recordId) {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE_ENTIDADES}/${recordId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.fields?.["Nome"] ?? "";
  } catch {
    return "";
  }
}

async function buscarDadosVoluntario(apiKey, baseId, recordId) {
  try {
    const table = TABLE_VOLUNTARIOS || process.env.AIRTABLE_TABLE_VOLUNTARIOS;
    if (!table) return { nome: "", email: "" };
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!res.ok) return { nome: "", email: "" };
    const data = await res.json();
    return {
      nome:  data.fields?.["Nome Completo"] ?? "",
      email: data.fields?.["Email"]         ?? "",
    };
  } catch {
    return { nome: "", email: "" };
  }
}

export async function POST(req, { params }) {
  const { id: recordId } = await params;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table  = process.env.AIRTABLE_TABLE_CERTIFICADOS;

  if (!apiKey || !baseId || !table || !recordId) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 500 });
  }

  try {
    const recRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!recRes.ok) {
      return NextResponse.json({ error: "Registro não encontrado." }, { status: 404 });
    }

    const rec = await recRes.json();
    const qtdeHoras   = rec.fields["Qtde Horas"] ?? 0;
    const atividade   = rec.fields["Atividade"] ?? "";
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // Voluntário é linked record → resolve nome
    const voluntarioIds = rec.fields["Voluntario"];
    const voluntarioId  = Array.isArray(voluntarioIds) ? voluntarioIds[0] : null;
    const { nome: voluntario } = voluntarioId
      ? await buscarDadosVoluntario(apiKey, baseId, voluntarioId)
      : { nome: "" };

    // Buscar nome da entidade vinculada
    const entidadeIds = rec.fields["Entidade"];
    const entidade = Array.isArray(entidadeIds) && entidadeIds.length > 0
      ? await buscarNomeEntidade(apiKey, baseId, entidadeIds[0])
      : "";

    const pdfBuffer = await gerarCertificadoPdf({ voluntario, qtdeHoras, atividade, entidade, dataEmissao });
    const filename = `certificado-${voluntario.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    const host  = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const pdfUrl = `${proto}://${host}/api/certificados/${recordId}/pdf`;

    const patchRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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

    const patchData  = await patchRes.json();
    const anexos     = patchData.fields?.["Certificado gerado"];
    const arquivoSalvo = Array.isArray(anexos) && anexos.length > 0;

    return NextResponse.json({
      success: true,
      arquivoSalvo,
      pdfBase64: arquivoSalvo ? null : Buffer.from(pdfBuffer).toString("base64"),
      filename,
    });
  } catch (err) {
    console.error("Erro ao gerar certificado:", err);
    return NextResponse.json({ error: "Erro inesperado ao gerar o certificado." }, { status: 500 });
  }
}
