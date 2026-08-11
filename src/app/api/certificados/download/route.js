export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get("url");
  const filename = searchParams.get("filename") ?? "certificado.pdf";

  if (!fileUrl) {
    return new Response("URL não informada.", { status: 400 });
  }

  try {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return new Response("Arquivo não encontrado.", { status: 404 });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch {
    return new Response("Erro ao baixar o arquivo.", { status: 500 });
  }
}
