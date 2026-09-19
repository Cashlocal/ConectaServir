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
const CINZA       = rgb(0.231, 0.231, 0.231);

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

export async function gerarCertificadoPdf({ voluntario, qtdeHoras, atividade, dataEmissao }) {
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

  // ── MOLDURA DOURADA DUPLA ──────────────────────────────────────────────────
  const B1 = 34;
  const B2 = 39;
  page.drawRectangle({ x: B1, y: B1, width: width - B1 * 2, height: height - B1 * 2, borderColor: OURO, borderWidth: 1.2 });
  page.drawRectangle({ x: B2, y: B2, width: width - B2 * 2, height: height - B2 * 2, borderColor: OURO, borderWidth: 0.45 });

  // Cantos Art Deco (marcas em L em cada canto)
  const CL = 22;
  const corners = [
    { h: [B1, height - B1, B1 + CL, height - B1],      v: [B1, height - B1, B1, height - B1 - CL] },
    { h: [width - B1, height - B1, width - B1 - CL, height - B1], v: [width - B1, height - B1, width - B1, height - B1 - CL] },
    { h: [B1, B1, B1 + CL, B1],                         v: [B1, B1, B1, B1 + CL] },
    { h: [width - B1, B1, width - B1 - CL, B1],         v: [width - B1, B1, width - B1, B1 + CL] },
  ];
  for (const c of corners) {
    page.drawLine({ start: { x: c.h[0], y: c.h[1] }, end: { x: c.h[2], y: c.h[3] }, thickness: 2, color: OURO });
    page.drawLine({ start: { x: c.v[0], y: c.v[1] }, end: { x: c.v[2], y: c.v[3] }, thickness: 2, color: OURO });
  }

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
  const titleY    = logoY - 52;
  page.drawText(titleText, {
    x: cx(titleText, bold, titleSize, width, titleCS),
    y: titleY,
    size: titleSize,
    font: bold,
    color: AZUL_TITULO,
    characterSpacing: titleCS,
  });

  // ── SUBTÍTULO "DE RECONHECIMENTO" ─────────────────────────────────────────
  const subSize = 11;
  const subCS   = 2.5;
  const subText = "DE RECONHECIMENTO";
  const subW    = bold.widthOfTextAtSize(subText, subSize) + subCS * (subText.length - 1);
  const subX    = (width - subW) / 2;
  const subY    = titleY - 26;

  const lineLen = 70;
  const lineGap = 10;
  page.drawLine({ start: { x: subX - lineGap - lineLen, y: subY + 4 }, end: { x: subX - lineGap,        y: subY + 4 }, thickness: 0.7, color: OURO });
  page.drawLine({ start: { x: subX + subW + lineGap,    y: subY + 4 }, end: { x: subX + subW + lineGap + lineLen, y: subY + 4 }, thickness: 0.7, color: OURO });
  page.drawText(subText, { x: subX, y: subY, size: subSize, font: bold, color: OURO, characterSpacing: subCS });

  // ── TEXTO INTRODUTÓRIO ─────────────────────────────────────────────────────
  const introSize = 10.5;
  const introText = "o Rotary Club de Pato Branco tem a honra de reconhecer o talento e dedicação de";
  const introY    = subY - 30;
  page.drawText(introText, { x: cx(introText, regular, introSize, width), y: introY, size: introSize, font: regular, color: CINZA });

  // ── NOME (FONTE SCRIPT) ────────────────────────────────────────────────────
  const nameSize = 46;
  const nameY    = introY - 52;
  const nameW    = scriptFont.widthOfTextAtSize(voluntario, nameSize);
  const nameX    = (width - nameW) / 2;
  page.drawText(voluntario, { x: nameX, y: nameY, size: nameSize, font: scriptFont, color: AZUL_TITULO });

  // Sublinhado dourado
  const underlineY = nameY - 10;
  page.drawLine({
    start: { x: nameX - 15, y: underlineY },
    end:   { x: nameX + nameW + 15, y: underlineY },
    thickness: 1.2,
    color: OURO,
  });

  // ── CORPO DO TEXTO ─────────────────────────────────────────────────────────
  const bodySize  = 10.5;
  const bodyLineH = 15;
  const contentW  = width - 130;

  let bodyY = underlineY - 27;

  // "pela participação no"
  const intro2 = "pela participação no";
  page.drawText(intro2, { x: cx(intro2, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: CINZA });

  // Nome da atividade em negrito
  const actLines = wrapText(atividade, bold, bodySize + 0.5, contentW - 60);
  for (const line of actLines) {
    bodyY -= bodyLineH;
    page.drawText(line, { x: cx(line, bold, bodySize + 0.5, width), y: bodyY, size: bodySize + 0.5, font: bold, color: CINZA });
  }

  // Linhas descritivas fixas
  const descLines = [
    "com obras que enriquecem nossa comunidade, inspiram solidariedade e fortalecem a cultura.",
    "Seu trabalho deixa marcas que vão além da arte.",
  ];
  for (const dline of descLines) {
    const wrapped = wrapText(dline, regular, bodySize, contentW);
    for (const wl of wrapped) {
      bodyY -= bodyLineH;
      page.drawText(wl, { x: cx(wl, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: CINZA });
    }
  }

  // ── FRASE DE RECONHECIMENTO ────────────────────────────────────────────────
  const ackText = "Nosso sincero reconhecimento e gratidão!";
  const ackY    = bodyY - 22;
  page.drawText(ackText, { x: cx(ackText, italic, 11, width), y: ackY, size: 11, font: italic, color: OURO });

  // ── DATA ───────────────────────────────────────────────────────────────────
  const dateText = `Pato Branco, ${dataEmissao}`;
  const dateY    = ackY - 22;
  page.drawText(dateText, { x: cx(dateText, regular, 10.5, width), y: dateY, size: 10.5, font: regular, color: CINZA });

  // ── ASSINATURAS ────────────────────────────────────────────────────────────
  const sigLineW = 145;
  const sigY     = B1 + 55;
  const leftCx   = width * 0.27;
  const rightCx  = width * 0.73;

  function drawSignature(centerX, labelLines, year) {
    page.drawLine({
      start: { x: centerX - sigLineW / 2, y: sigY },
      end:   { x: centerX + sigLineW / 2, y: sigY },
      thickness: 0.5, color: CINZA,
    });
    let labelY = sigY - 15;
    for (const lbl of labelLines) {
      const lblSize = 8.5;
      page.drawText(lbl, { x: centerX - bold.widthOfTextAtSize(lbl, lblSize) / 2, y: labelY, size: lblSize, font: bold, color: AZUL_TITULO });
      labelY -= 12;
    }
    page.drawText(year, { x: centerX - regular.widthOfTextAtSize(year, 8.5) / 2, y: labelY, size: 8.5, font: regular, color: CINZA });
  }

  drawSignature(leftCx,  ["PRESIDENTE"],                         "2025-26");
  drawSignature(rightCx, ["COMISSÃO DO LEILÃO DE ARTES"],        "2025-26");

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
