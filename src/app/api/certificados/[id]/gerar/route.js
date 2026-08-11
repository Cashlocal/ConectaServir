import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

const ROTARY_LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/dKVDgjXQNCKLeoRo.png";
const CONECTASERVIR_LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/eJNAqnoEJSXNihcF.png";

const AZUL       = rgb(0.102, 0.267, 0.663);  // #1a44a6
const AZUL_ESC   = rgb(0.118, 0.227, 0.541);  // #1e3a8a
const CINZA      = rgb(0.282, 0.361, 0.420);  // #475569
const CINZA_CLARO = rgb(0.580, 0.631, 0.682); // #94a3b8

function centralize(text, font, size, pageWidth) {
  return (pageWidth - font.widthOfTextAtSize(text, size)) / 2;
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function gerarPdfBuffer({ voluntario, qtdeHoras, atividade, dataEmissao }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const M = 55; // margem
  const contentW = width - M * 2;

  // ── Bordas decorativas ──────────────────────────────────────
  page.drawRectangle({
    x: M - 15, y: M - 15,
    width: width - (M - 15) * 2, height: height - (M - 15) * 2,
    borderColor: AZUL, borderWidth: 2.5,
  });
  page.drawRectangle({
    x: M - 8, y: M - 8,
    width: width - (M - 8) * 2, height: height - (M - 8) * 2,
    borderColor: AZUL, borderWidth: 0.5,
  });

  // ── Logos ────────────────────────────────────────────────────
  const logoH = 58;
  const logoY = height - M - logoH;

  let rotaryImg, conectaImg;
  try {
    const bytes = await fetch(ROTARY_LOGO_URL).then((r) => r.arrayBuffer());
    rotaryImg = await pdfDoc.embedPng(bytes);
  } catch { /* logo opcional */ }
  try {
    const bytes = await fetch(CONECTASERVIR_LOGO_URL).then((r) => r.arrayBuffer());
    conectaImg = await pdfDoc.embedPng(bytes);
  } catch { /* logo opcional */ }

  if (rotaryImg) {
    const dims = rotaryImg.scale(logoH / rotaryImg.height);
    page.drawImage(rotaryImg, { x: M, y: logoY, width: dims.width, height: logoH });
  }
  if (conectaImg) {
    const dims = conectaImg.scale(logoH / conectaImg.height);
    page.drawImage(conectaImg, {
      x: width - M - dims.width, y: logoY,
      width: dims.width, height: logoH,
    });
  }

  // ── Linha dupla após logos ───────────────────────────────────
  const lineY = logoY - 18;
  page.drawLine({ start: { x: M, y: lineY }, end: { x: width - M, y: lineY }, thickness: 1.5, color: AZUL });
  page.drawLine({ start: { x: M, y: lineY - 4 }, end: { x: width - M, y: lineY - 4 }, thickness: 0.5, color: AZUL });

  // ── Título ───────────────────────────────────────────────────
  const t1 = "CERTIFICADO";
  const t1Size = 38;
  page.drawText(t1, {
    x: centralize(t1, bold, t1Size, width),
    y: lineY - 62,
    size: t1Size, font: bold, color: AZUL_ESC,
  });

  const t2 = "DE VOLUNTARIADO";
  const t2Size = 17;
  page.drawText(t2, {
    x: centralize(t2, bold, t2Size, width),
    y: lineY - 90,
    size: t2Size, font: bold, color: AZUL,
  });

  // ── Ornamento abaixo do título ───────────────────────────────
  const orn1Y = lineY - 110;
  page.drawLine({
    start: { x: M + 60, y: orn1Y }, end: { x: width - M - 60, y: orn1Y },
    thickness: 0.5, color: CINZA_CLARO,
  });

  // ── "Certificamos que" ───────────────────────────────────────
  const certText = "Certificamos que";
  const certSize = 13;
  page.drawText(certText, {
    x: centralize(certText, italic, certSize, width),
    y: orn1Y - 38,
    size: certSize, font: italic, color: CINZA,
  });

  // ── Nome do voluntário ───────────────────────────────────────
  const nameY = orn1Y - 88;
  const nameSize = 27;
  const nameLines = wrapText(voluntario, bold, nameSize, contentW - 40);
  nameLines.forEach((line, i) => {
    page.drawText(line, {
      x: centralize(line, bold, nameSize, width),
      y: nameY - i * (nameSize + 5),
      size: nameSize, font: bold, color: AZUL_ESC,
    });
  });
  const nameBlockEnd = nameY - (nameLines.length - 1) * (nameSize + 5);
  page.drawLine({
    start: { x: M + 80, y: nameBlockEnd - 10 },
    end: { x: width - M - 80, y: nameBlockEnd - 10 },
    thickness: 0.5, color: AZUL,
  });

  // ── Horas ────────────────────────────────────────────────────
  const hoursY = nameBlockEnd - 55;
  const hoursText = `realizou  ${qtdeHoras} ${qtdeHoras === 1 ? "hora" : "horas"}  de atividade voluntária em:`;
  const hoursSize = 13;
  page.drawText(hoursText, {
    x: centralize(hoursText, regular, hoursSize, width),
    y: hoursY, size: hoursSize, font: regular, color: CINZA,
  });

  // ── Atividade ────────────────────────────────────────────────
  const actY = hoursY - 42;
  const actSize = 15;
  const actLines = wrapText(atividade, bold, actSize, contentW - 80);
  actLines.forEach((line, i) => {
    page.drawText(line, {
      x: centralize(line, bold, actSize, width),
      y: actY - i * (actSize + 7),
      size: actSize, font: bold, color: AZUL_ESC,
    });
  });

  // ── Data de emissão ──────────────────────────────────────────
  const dateY = M + 115;
  const dateText = `Pato Branco, ${dataEmissao}`;
  const dateSize = 11;
  page.drawText(dateText, {
    x: centralize(dateText, regular, dateSize, width),
    y: dateY, size: dateSize, font: regular, color: CINZA,
  });

  // ── Linha de assinatura ──────────────────────────────────────
  const sigY = dateY - 42;
  page.drawLine({
    start: { x: width / 2 - 90, y: sigY },
    end:   { x: width / 2 + 90, y: sigY },
    thickness: 0.5, color: CINZA,
  });

  const clubText = "Rotary Club de Pato Branco";
  const clubSize = 10;
  page.drawText(clubText, {
    x: centralize(clubText, regular, clubSize, width),
    y: sigY - 14, size: clubSize, font: regular, color: CINZA,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(_req, { params }) {
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
    const voluntario = rec.fields["Voluntario"] ?? "";
    const qtdeHoras  = rec.fields["Qtde Horas"] ?? 0;
    const atividade  = rec.fields["Atividade"] ?? "";
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit", month: "long", year: "numeric",
    });

    // 2. Gerar PDF
    const pdfBuffer = await gerarPdfBuffer({ voluntario, qtdeHoras, atividade, dataEmissao });
    const filename = `certificado-${voluntario.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    // 3. Upload do PDF como anexo no Airtable
    const formData = new FormData();
    formData.append("file", new Blob([pdfBuffer], { type: "application/pdf" }), filename);
    formData.append("filename", filename);
    formData.append("contentType", "application/pdf");

    const uploadRes = await fetch(
      `https://content.airtable.com/v0/${baseId}/${recordId}/${encodeURIComponent("Certificado gerado")}/uploadAttachment`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.json().catch(() => ({}));
      console.error("Airtable upload error:", errBody);
      return NextResponse.json({ error: "Erro ao salvar o arquivo no servidor." }, { status: 502 });
    }

    // 4. Atualizar status para Emitido
    await fetch(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: { Status: "Emitido" } }),
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao gerar certificado:", err);
    return NextResponse.json({ error: "Erro inesperado ao gerar o certificado." }, { status: 500 });
  }
}
