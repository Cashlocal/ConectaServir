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
  const titleY    = logoY - 52;
  page.drawText(titleText, {
    x: cx(titleText, bold, titleSize, width, titleCS),
    y: titleY,
    size: titleSize,
    font: bold,
    color: AZUL_TITULO,
    characterSpacing: titleCS,
  });

  // ── SUBTÍTULO "DE RECONHECIMENTO" centralizado entre os traços ────────────
  // As linhas são posicionadas como proporção da largura da página para
  // garantir simetria perfeita, independente da largura renderizada do texto.
  const subSize = 11;
  const subCS   = 2.5;
  const subText = "DE RECONHECIMENTO";
  const subY    = titleY - 26;

  const subLX1 = width * 0.310;   // início da linha esquerda
  const subLX2 = width * 0.398;   // fim da linha esquerda (borda interna)
  const subRX1 = width * 0.602;   // início da linha direita (borda interna)
  const subRX2 = width * 0.690;   // fim da linha direita

  page.drawLine({ start: { x: subLX1, y: subY + 4 }, end: { x: subLX2, y: subY + 4 }, thickness: 0.7, color: OURO });
  page.drawLine({ start: { x: subRX1, y: subY + 4 }, end: { x: subRX2, y: subY + 4 }, thickness: 0.7, color: OURO });
  page.drawText(subText, { x: cx(subText, bold, subSize, width, subCS), y: subY, size: subSize, font: bold, color: OURO, characterSpacing: subCS });

  // ── TEXTO INTRODUTÓRIO ─────────────────────────────────────────────────────
  const introSize = 10.5;
  const introText = "o Rotary Club de Pato Branco tem a honra de reconhecer o talento e dedicação de";
  const introY    = subY - 30;
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

  // "pela participação no"
  const intro2 = "pela participação no";
  page.drawText(intro2, { x: cx(intro2, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });

  // Nome da atividade em negrito
  const actLines = wrapText(atividade, bold, bodySize + 0.5, contentW - 60);
  for (const line of actLines) {
    bodyY -= bodyLineH;
    page.drawText(line, { x: cx(line, bold, bodySize + 0.5, width), y: bodyY, size: bodySize + 0.5, font: bold, color: AZUL_TITULO });
  }

  // Horas (exibido apenas quando preenchido)
  const horas = Number(qtdeHoras);
  if (horas > 0) {
    const horasText = `${horas} ${horas === 1 ? "hora" : "horas"} de atividade voluntária`;
    bodyY -= bodyLineH;
    page.drawText(horasText, { x: cx(horasText, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });
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
      page.drawText(wl, { x: cx(wl, regular, bodySize, width), y: bodyY, size: bodySize, font: regular, color: AZUL_TITULO });
    }
  }

  // ── FRASE DE RECONHECIMENTO ────────────────────────────────────────────────
  const ackText = "Nosso sincero reconhecimento e gratidão!";
  const ackY    = bodyY - 22;
  page.drawText(ackText, { x: cx(ackText, italic, 11, width), y: ackY, size: 11, font: italic, color: OURO });

  // ── DATA ───────────────────────────────────────────────────────────────────
  const dateText = `Pato Branco, ${dataEmissao}`;
  const dateY    = ackY - 22;
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
