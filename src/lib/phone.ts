/**
 * Remove tudo que não é dígito de um telefone.
 */
export function stripPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata telefone brasileiro para exibição: (11) 99999-9999
 */
export function formatPhone(value: string): string {
  const digits = stripPhone(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Normaliza para formato internacional sem +: 5511999999999
 * Se o usuário não colocou o 55, adiciona automaticamente.
 */
export function normalizePhone(value: string): string {
  const digits = stripPhone(value);
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}
