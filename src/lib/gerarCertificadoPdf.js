import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const ROTARY_LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/dKVDgjXQNCKLeoRo.png";
const CONECTASERVIR_LOGO_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031850996/eJNAqnoEJSXNihcF.png";

const AZUL        = rgb(0.102, 0.267, 0.663);
const AZUL_ESC    = rgb(0.118, 0.227, 0.541);
const CINZA       = rgb(0.282, 0.361, 0.420);
const CINZA_CLARO = rgb(0.580, 0.631, 0.682);

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

export async function gerarCertificadoPdf({ voluntario, qtdeHoras, atividade, dataEmissao }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const M = 55;
  const contentW = width - M * 2;

  // Bordas
  page.drawRectangle({ x: M - 15, y: M - 15, width: width - (M - 15) * 2, height: height - (M - 15) * 2, borderColor: AZUL, borderWidth: 2.5 });
  page.drawRectangle({ x: M - 8,  y: M - 8,  width: width - (M - 8)  * 2, height: height - (M - 8)  * 2, borderColor: AZUL, borderWidth: 0.5 });

  // Logos
  const logoH = 58;
  const logoY = height - M - logoH;
  let rotaryImg, conectaImg;
  try { rotaryImg  = await pdfDoc.embedPng(await fetch(ROTARY_LOGO_URL).then(r => r.arrayBuffer())); } catch {}
  try { conectaImg = await pdfDoc.embedPng(await fetch(CONECTASERVIR_LOGO_URL).then(r => r.arrayBuffer())); } catch {}

  if (rotaryImg)  { const d = rotaryImg.scale(logoH / rotaryImg.height);   page.drawImage(rotaryImg,  { x: M, y: logoY, width: d.width, height: logoH }); }
  if (conectaImg) { const d = conectaImg.scale(logoH / conectaImg.height);  page.drawImage(conectaImg, { x: width - M - d.width, y: logoY, width: d.width, height: logoH }); }

  // Linhas após logos
  const lineY = logoY - 18;
  page.drawLine({ start: { x: M, y: lineY },     end: { x: width - M, y: lineY },     thickness: 1.5, color: AZUL });
  page.drawLine({ start: { x: M, y: lineY - 4 }, end: { x: width - M, y: lineY - 4 }, thickness: 0.5, color: AZUL });

  // Título
  const t1 = "CERTIFICADO";
  page.drawText(t1, { x: centralize(t1, bold, 38, width), y: lineY - 62,  size: 38, font: bold, color: AZUL_ESC });
  const t2 = "DE VOLUNTARIADO";
  page.drawText(t2, { x: centralize(t2, bold, 17, width), y: lineY - 90,  size: 17, font: bold, color: AZUL });

  // Ornamento
  const orn1Y = lineY - 110;
  page.drawLine({ start: { x: M + 60, y: orn1Y }, end: { x: width - M - 60, y: orn1Y }, thickness: 0.5, color: CINZA_CLARO });

  // Certificamos que
  const certText = "Certificamos que";
  page.drawText(certText, { x: centralize(certText, italic, 13, width), y: orn1Y - 38, size: 13, font: italic, color: CINZA });

  // Nome
  const nameY = orn1Y - 88;
  const nameLines = wrapText(voluntario, bold, 27, contentW - 40);
  nameLines.forEach((line, i) => page.drawText(line, { x: centralize(line, bold, 27, width), y: nameY - i * 32, size: 27, font: bold, color: AZUL_ESC }));
  const nameBlockEnd = nameY - (nameLines.length - 1) * 32;
  page.drawLine({ start: { x: M + 80, y: nameBlockEnd - 10 }, end: { x: width - M - 80, y: nameBlockEnd - 10 }, thickness: 0.5, color: AZUL });

  // Horas
  const hoursY = nameBlockEnd - 55;
  const hoursText = `realizou  ${qtdeHoras} ${qtdeHoras === 1 ? "hora" : "horas"}  de atividade voluntária em:`;
  page.drawText(hoursText, { x: centralize(hoursText, regular, 13, width), y: hoursY, size: 13, font: regular, color: CINZA });

  // Atividade
  const actY = hoursY - 42;
  const actLines = wrapText(atividade, bold, 15, contentW - 80);
  actLines.forEach((line, i) => page.drawText(line, { x: centralize(line, bold, 15, width), y: actY - i * 22, size: 15, font: bold, color: AZUL_ESC }));

  // Data
  const dateY = M + 115;
  const dateText = `Pato Branco, ${dataEmissao}`;
  page.drawText(dateText, { x: centralize(dateText, regular, 11, width), y: dateY, size: 11, font: regular, color: CINZA });

  // Assinatura
  const sigY = dateY - 42;
  page.drawLine({ start: { x: width / 2 - 90, y: sigY }, end: { x: width / 2 + 90, y: sigY }, thickness: 0.5, color: CINZA });
  const clubText = "Rotary Club de Pato Branco";
  page.drawText(clubText, { x: centralize(clubText, regular, 10, width), y: sigY - 14, size: 10, font: regular, color: CINZA });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
