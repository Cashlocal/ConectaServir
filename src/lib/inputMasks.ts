/** Remove tudo que não é dígito. */
export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Máscara telefone BR: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * Até 11 dígitos.
 */
export function maskPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6)
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/**
 * Email: remove espaços e restringe a caracteres comuns em endereços de email.
 */
export function maskEmailInput(value: string): string {
  const noSpaces = value.replace(/\s/g, "");
  return noSpaces.replace(/[^a-zA-Z0-9@._+\-]/g, "").slice(0, 254);
}

/** Validação de email (formato prático). */
export function isValidEmail(email: string): boolean {
  const t = email.trim();
  if (t.length < 5 || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
}

/**
 * Telefone BR opcional: vazio é válido; se preenchido, exige 10 ou 11 dígitos (DDD + número).
 */
export function isValidPhoneBROptional(phone: string): boolean {
  const d = onlyDigits(phone);
  if (d.length === 0) return true;
  return d.length === 10 || d.length === 11;
}

export const MSG_EMAIL_INVALIDO = "Digite um email válido (ex.: nome@email.com).";
export const MSG_TELEFONE_INVALIDO =
  "Telefone inválido. Informe DDD + número (10 ou 11 dígitos) ou deixe em branco.";
