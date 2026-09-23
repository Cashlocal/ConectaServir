import { NextResponse } from "next/server";

const TABLE = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";

function mapRecord(r) {
  const logoArr = r.fields["Logo"];
  return {
    id:                 r.id,
    nome:               r.fields["Nome"]                        ?? "",
    descricao:          r.fields["Descricao"]                   ?? "",
    cnpj:               r.fields["CNPJ"]                        ?? "",
    telefoneEntidade:   r.fields["Telefone Entidade"]           ?? "",
    emailEntidade:      r.fields["Email Entidade"]              ?? "",
    nomePessoaResp:     r.fields["Nome Pessoa Responsável"]     ?? "",
    telefonePessoaResp: r.fields["Telefone Pessoa Responsável"] ?? "",
    emailPessoaResp:    r.fields["Email Pessoa Responsável"]    ?? "",
    status:             r.fields["Status"]                      ?? "Pendente",
    logo:               Array.isArray(logoArr) ? (logoArr[0]?.url ?? null) : null,
  };
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    const { nome, descricao, cnpj, telefoneEntidade, emailEntidade,
            nomePessoaResp, telefonePessoaResp, emailPessoaResp, logoUrl } = await req.json();

    if (!nome?.trim()) {
      return NextResponse.json({ error: "O campo Nome é obrigatório." }, { status: 400 });
    }

    const fields = {
      Nome:                          nome.trim(),
      Descricao:                     (descricao          ?? "").trim(),
      CNPJ:                          (cnpj               ?? "").trim(),
      "Telefone Entidade":           (telefoneEntidade   ?? "").trim(),
      "Email Entidade":              (emailEntidade      ?? "").trim(),
      "Nome Pessoa Responsável":     (nomePessoaResp     ?? "").trim(),
      "Telefone Pessoa Responsável": (telefonePessoaResp ?? "").trim(),
      "Email Pessoa Responsável":    (emailPessoaResp    ?? "").trim(),
    };
    if (logoUrl) fields["Logo"] = [{ url: logoUrl }];

    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${TABLE}/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao atualizar entidade." },
        { status: res.status }
      );
    }
    return NextResponse.json(mapRecord(data));
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const { id } = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${TABLE}/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.error?.message ?? "Erro ao excluir entidade." },
        { status: res.status }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
