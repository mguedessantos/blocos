// Endereços de cliente (subdomínios): escola-aurora.seusite.com.br
export const RESERVED_SLUGS = new Set([
  "www", "app", "api", "admin", "blog", "docs", "ajuda", "suporte", "status", "mail", "email",
  "static", "cdn", "assets", "plataforma", "precos", "cadastro", "entrar", "jams", "blocos",
]);

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
}

export function slugError(slug: string): string | null {
  if (slug.length < 3 || slug.length > 30) return "O endereço deve ter entre 3 e 30 caracteres.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Use só letras minúsculas, números e hífens.";
  if (RESERVED_SLUGS.has(slug)) return "Este endereço é reservado. Escolha outro.";
  return null;
}
