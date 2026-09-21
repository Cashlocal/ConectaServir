import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const { id }      = await params;
  const apiKey      = process.env.AIRTABLE_API_KEY;
  const baseId      = process.env.AIRTABLE_BASE_ID;
  const tabProj     = process.env.AIRTABLE_TABLE_PROJETOS;
  const tabCert     = process.env.AIRTABLE_TABLE_CERTIFICADOS;

  if (!apiKey || !baseId || !tabProj) {
    return NextResponse.json({ error: "Configuração incompleta." }, { status: 503 });
  }

  try {
    const { voluntarioId } = await req.json();
    if (!voluntarioId) return NextResponse.json({ error: "voluntarioId obrigatório." }, { status: 400 });

    // Busca projeto para obter voluntários já vinculados, nome e entidade
    const getRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tabProj)}/${id}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    if (!getRes.ok) return NextResponse.json({ error: "Projeto não encontrado." }, { status: 404 });

    const projeto   = await getRes.json();
    const atuais    = projeto.fields["Voluntários"] ?? [];
    const jaVinc    = Array.isArray(atuais) ? atuais : [];
    const jaExiste  = jaVinc.includes(voluntarioId);

    if (!jaExiste) {
      const novaLista = [...jaVinc, voluntarioId];
      const patchRes = await fetch(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tabProj)}/${id}`,
        {
          method:  "PATCH",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body:    JSON.stringify({ fields: { "Voluntários": novaLista } }),
        }
      );

      if (!patchRes.ok) {
        const d = await patchRes.json().catch(() => ({}));
        return NextResponse.json({ error: d?.error?.message ?? "Erro ao vincular." }, { status: patchRes.status });
      }
    }

    // Cria certificado automático com status Pendente
    if (tabCert) {
      try {
        const nomeProjeto = projeto.fields["Nome do Projeto"] ?? "Projeto";
        const entidadeIds = projeto.fields["Entidade"];

        const certFields = {
          "Voluntario": [voluntarioId],
          "Atividade":  nomeProjeto,
          "Qtde Horas": 0,
          "Status":     "Pendente",
        };
        if (Array.isArray(entidadeIds) && entidadeIds.length > 0) {
          certFields["Entidade"] = entidadeIds;
        }

        const certRes = await fetch(
          `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tabCert)}`,
          {
            method:  "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body:    JSON.stringify({ fields: certFields }),
          }
        );

        if (certRes.ok) {
          const certData = await certRes.json();
          const certId   = certData.id;

          // Salva URL do PDF no certificado (gerado dinamicamente pelo endpoint /pdf)
          const host     = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
          const proto    = req.headers.get("x-forwarded-proto") ?? "https";
          const pdfUrl   = `${proto}://${host}/api/certificados/${certId}/pdf`;
          const filename = `certificado-${certId}.pdf`;

          await fetch(
            `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tabCert)}/${certId}`,
            {
              method:  "PATCH",
              headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
              body:    JSON.stringify({
                fields: { "Certificado gerado": [{ url: pdfUrl, filename }] },
              }),
            }
          );
        }
      } catch {
        // Falha silenciosa: o vínculo com o projeto já foi salvo
      }
    }

    return NextResponse.json({ ok: true, jaVinculado: jaExiste });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
