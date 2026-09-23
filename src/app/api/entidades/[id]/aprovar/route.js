import { NextResponse } from "next/server";

const TABLE         = process.env.AIRTABLE_TABLE_ENTIDADES ?? "tblPIOP4H76gOOPSe";
const WEBHOOK       = "https://integrador.cashlocal.com.br/webhook/d1be98bc-923e-4dcf-ae5a-974ef17932e9";
const LINK_ACESSO   = "https://www.conectaservir.com.br/login";

function gerarSenha(cnpj) {
  // Remove tudo que não é dígito e pega os 6 primeiros
  const digits = String(cnpj ?? "").replace(/\D/g, "");
  return digits.slice(0, 6) || "123456";
}

export async function POST(_req, { params }) {
  const { id } = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableUsuarios = process.env.AIRTABLE_TABLE_USUARIOS;

  if (!apiKey || !baseId) {
    return NextResponse.json({ error: "Configuração do servidor incompleta." }, { status: 503 });
  }

  try {
    // 1. Buscar dados atuais da entidade
    const recRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE}/${id}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );
    if (!recRes.ok) {
      return NextResponse.json({ error: "Entidade não encontrada." }, { status: 404 });
    }
    const rec = await recRes.json();
    const fields = rec.fields ?? {};

    const entidade = {
      id,
      nome:               fields["Nome"]                        ?? "",
      descricao:          fields["Descricao"]                   ?? "",
      cnpj:               fields["CNPJ"]                        ?? "",
      telefoneEntidade:   fields["Telefone Entidade"]           ?? "",
      emailEntidade:      fields["Email Entidade"]              ?? "",
      nomePessoaResp:     fields["Nome Pessoa Responsável"]     ?? "",
      telefonePessoaResp: fields["Telefone Pessoa Responsável"] ?? "",
      emailPessoaResp:    fields["Email Pessoa Responsável"]    ?? "",
    };

    const senha = gerarSenha(entidade.cnpj);
    const emailUsuario = entidade.emailPessoaResp || entidade.emailEntidade;

    // 2. Criar usuário do tipo entidade no Airtable (tabela Usuários)
    let usuarioCriado = null;
    if (tableUsuarios && emailUsuario) {
      try {
        const userRes = await fetch(
          `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableUsuarios)}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: {
                nome:   entidade.nomePessoaResp || entidade.nome,
                email:  emailUsuario,
                Senha:  senha,
                Clube:  entidade.nome,
                Tipo:   "Entidade",
                Status: "Ativo",
              },
            }),
          }
        );
        if (userRes.ok) {
          const userData = await userRes.json();
          usuarioCriado = { id: userData.id, email: emailUsuario };
        } else {
          const errData = await userRes.json().catch(() => ({}));
          console.error("Erro ao criar usuário entidade:", errData);
        }
      } catch (userErr) {
        console.error("Erro ao criar usuário entidade:", userErr);
      }
    }

    // 3. Atualizar status para Aprovada no Airtable
    const patchRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/${TABLE}/${id}`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { Status: "Aprovada" } }),
      }
    );
    if (!patchRes.ok) {
      const err = await patchRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message ?? "Erro ao atualizar status." },
        { status: patchRes.status }
      );
    }

    // 4. Disparar webhook com todos os dados para envio de e-mails
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entidade,
          status:      "Aprovada",
          linkAcesso:  LINK_ACESSO,
          emailUsuario,
          senhaUsuario: senha,
          usuarioCriado,
        }),
      });
    } catch (webhookErr) {
      console.error("Webhook error:", webhookErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao aprovar entidade:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
