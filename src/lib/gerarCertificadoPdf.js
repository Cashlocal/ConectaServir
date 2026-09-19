import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs";
import path from "path";

const ROTARY_LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/dKVDgjXQNCKLeoRo.png";

// Paleta de cores do modelo
const AZUL_FUNDO  = rgb(0.082, 0.208, 0.529);
const BRANCO      = rgb(1, 1, 1);
const AZUL_TITULO = rgb(0.063, 0.184, 0.478);
const OURO        = rgb(0.784, 0.639, 0.082);

/**
 * Centraliza texto horizontalmente considerando character spacing.
 */
function cx(text, font, size, pageWidth, charSpacing = 0) {
  const w = font.widthOfTextAtSize(text, size) + charSpacing * (text.length - 1);
  return (pageWidth - w) / 2;
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

export async function gerarCertificadoPdf({ voluntario, qtdeHoras, atividade, entidade, dataEmissao }) {
  const pdfDoc = await PDFDocument.create();

  // A4 paisagem
  const page = pdfDoc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();

  // Fontes padrão
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const timesBI = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  // Fonte script para o nome (fallback para Times Bold Italic)
  let scriptFont = timesBI;
  try {
    const fontPath = path.join(process.cwd(), "public", "fonts", "DancingScript-Bold.ttf");
    const fontBytes = fs.readFileSync(fontPath);
    scriptFont = await pdfDoc.embedFont(fontBytes);
  } catch {}

  // ── FUNDO AZUL ────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height, color: AZUL_FUNDO });

  // ── RETÂNGULO BRANCO INTERNO ───────────────────────────────────────────────
  const WM = 20;
  page.drawRectangle({
    x: WM, y: WM,
    width: width - WM * 2, height: height - WM * 2,
    color: BRANCO,
  });

  // ── MOLDURA DOURADA ────────────────────────────────────────────────────────
  // Retângulo externo (linha mais grossa)
  const B1 = 34;
  page.drawRectangle({
    x: B1, y: B1,
    width: width - B1 * 2, height: height - B1 * 2,
    borderColor: OURO, borderWidth: 1.0,
  });
  // Retângulo interno (linha fina)
  const B2 = 40;
  page.drawRectangle({
    x: B2, y: B2,
    width: width - B2 * 2, height: height - B2 * 2,
    borderColor: OURO, borderWidth: 0.4,
  });

  // Cantos Art Deco: colchetes em L dentro do retângulo externo
  // Posicionados levemente dentro de B1, criando um bracket visível
  const CC = B1 + 9;  // posição de início do bracket (dentro de B1)
  const CL = 20;      // comprimento de cada braço do L
  const CT = 1.5;     // espessura das marcas de canto

  // [top-left]
  page.drawLine({ start: { x: CC,         y: height - CC      }, end: { x: CC + CL,     y: height - CC      }, thickness: CT, color: OURO });
  page.drawLine({ start: { x: CC,         y: height - CC      }, end: { x: CC,           y: height - CC - CL }, thickness: CT, color: OURO });
  // [top-right]
  page.drawLine({ start: { x: width - CC, y: height - CC      }, end: { x: width-CC-CL,  y: height - CC      }, thickness: CT, color: OURO });
  page.drawLine({ start: { x: width - CC, y: height - CC      }, end: { x: width - CC,   y: height - CC - CL }, thickness: CT, color: OURO });
  // [bottom-left]
  page.drawLine({ start: { x: CC,         y: CC               }, end: { x: CC + CL,     y: CC               }, thickness: CT, color: OURO });
  page.drawLine({ start: { x: CC,         y: CC               }, end: { x: CC,           y: CC + CL          }, thickness: CT, color: OURO });
  // [bottom-right]
  page.drawLine({ start: { x: width - CC, y: CC               }, end: { x: width-CC-CL,  y: CC               }, thickness: CT, color: OURO });
  page.drawLine({ start: { x: width - CC, y: CC               }, end: { x: width - CC,   y: CC + CL          }, thickness: CT, color: OURO });

  // ── LOGO ROTARY ────────────────────────────────────────────────────────────
  let rotaryImg;
  try {
    const buf = await fetch(ROTARY_LOGO_URL).then((r) => r.arrayBuffer());
    rotaryImg = await pdfDoc.embedPng(buf);
  } catch {}

  const logoH = 50;
  const logoY = height - B1 - 14 - logoH;
  if (rotaryImg) {
    const d = rotaryImg.scale(logoH / rotaryImg.height);
    page.drawImage(rotaryImg, { x: (width - d.width) / 2, y: logoY, width: d.width, height: logoH });
  }

  // ── TÍTULO "CERTIFICADO" ───────────────────────────────────────────────────
  const titleSize = 38;
  const titleCS   = 5;
  const titleText = "CERTIFICADO";
  const titleY    = logoY - 70;
  page.drawText(titleText, {
    x: cx(titleText, bold, titleSize, width, titleCS),
    y: titleY,
    size: titleSize,
    font: bold,
    color: OURO,
    characterSpacing: titleCS,
  });

  // ── TEXTO INTRODUTÓRIO ─────────────────────────────────────────────────────
  const introSize = 10.5;
  const introText = "certifica a participação de";
  const introY    = titleY - 30;
  page.drawText(introText, { x: cx(introText, regular, introSize, width), y: introY, size: introSize, font: regular, color: AZUL_TITULO });
  // ── NOME (FONTE SCRIPT) ────────────────────────────────────────────────────
  const nameSize = 46;
  const nameY    = introY - 52;
  const nameW    = scriptFont.widthOfTextAtSize(voluntario, nameSize);
  const nameX    = (width - nameW) / 2;
  page.drawText(voluntario, { x: nameX, y: nameY, size: nameSize, font: scriptFont, color: AZUL_TITULO });

  // Sublinhado dourado
  const underlineY = nameY - 10;
  page.drawLine({
    start: { x: nameX - 15,       y: underlineY },
    end:   { x: nameX + nameW + 15, y: underlineY },
    thickness: 1.2,
    color: OURO,
  });

  // ── CORPO DO TEXTO ─────────────────────────────────────────────────────────
  const bodySize  = 10.5;
  const bodyLineH = 15;
  const contentW  = width - 130;

  let bodyY = underlineY - 27;

  // "na atividade"
  const intro2 = "na atividade";
  page.drawText(intro2, { x: cx(intro2, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });

  // Nome da atividade em negrito
  const actLines = wrapText(atividade, bold, bodySize + 0.5, contentW - 60);
  for (const line of actLines) {
    bodyY -= bodyLineH;
    page.drawText(line, { x: cx(line, bold, bodySize + 0.5, width), y: bodyY, size: bodySize + 0.5, font: bold, color: AZUL_TITULO });
  }

  // Entidade (exibida apenas quando preenchida)
  if (entidade) {
    const entLabel = "na entidade";
    bodyY -= bodyLineH;
    page.drawText(entLabel, { x: cx(entLabel, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });
    const entLines = wrapText(entidade, bold, bodySize + 0.5, contentW - 60);
    for (const line of entLines) {
      bodyY -= bodyLineH;
      page.drawText(line, { x: cx(line, bold, bodySize + 0.5, width), y: bodyY, size: bodySize + 0.5, font: bold, color: AZUL_TITULO });
    }
  }

  // Carga horária: "com duração de " regular + "X horas" negrito, centralizados juntos
  const horas = Number(qtdeHoras);
  if (horas > 0) {
    const prefix   = "com duração de ";
    const suffix   = `${horas} ${horas === 1 ? "hora" : "horas"}`;
    const prefixW  = regular.widthOfTextAtSize(prefix, bodySize);
    const suffixW  = bold.widthOfTextAtSize(suffix, bodySize);
    const startX   = (width - prefixW - suffixW) / 2;
    bodyY -= bodyLineH;
    page.drawText(prefix, { x: startX,            y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });
    page.drawText(suffix, { x: startX + prefixW,  y: bodyY, size: bodySize, font: bold,    color: AZUL_TITULO });
  }

  // Linha de encerramento
  const closingText = "contribuindo com nossa comunidade e os valores do Rotary.";
  bodyY -= bodyLineH;
  page.drawText(closingText, { x: cx(closingText, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });

  // ── DATA ───────────────────────────────────────────────────────────────────
  const dateText = `Pato Branco, ${dataEmissao}`;
  const dateY    = bodyY - 38;
  page.drawText(dateText, { x: cx(dateText, regular, 10.5, width), y: dateY, size: 10.5, font: regular, color: AZUL_TITULO });

  // ── ASSINATURAS ────────────────────────────────────────────────────────────
  const sigLineW = 145;
  const sigY     = B1 + 55;
  const leftCx   = width * 0.27;
  const rightCx  = width * 0.73;

  function drawSignature(centerX, label, year) {
    // Traço dourado
    page.drawLine({
      start: { x: centerX - sigLineW / 2, y: sigY },
      end:   { x: centerX + sigLineW / 2, y: sigY },
      thickness: 0.6, color: OURO,
    });
    const lblSize = 8.5;
    page.drawText(label, {
      x: centerX - bold.widthOfTextAtSize(label, lblSize) / 2,
      y: sigY - 15,
      size: lblSize, font: bold, color: AZUL_TITULO,
    });
    page.drawText(year, {
      x: centerX - regular.widthOfTextAtSize(year, 8.5) / 2,
      y: sigY - 27,
      size: 8.5, font: regular, color: AZUL_TITULO,
    });
  }

  drawSignature(leftCx,  "PRESIDENTE",                   "2025-26");
  drawSignature(rightCx, "COMISSÃO DO LEILÃO DE ARTES",  "2025-26");

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
