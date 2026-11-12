/** Unidades federativas do Brasil (sigla → nome). */
export const UFS = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
} as const;

export type UF = keyof typeof UFS;
export const UF_LIST = Object.keys(UFS) as UF[];

export function isUF(v: unknown): v is UF {
  return typeof v === "string" && v in UFS;
}

/** Cidade normalizada para gravar: espaços colapsados, sem pontas. */
export function cleanCity(v: string) {
  return v.replace(/\s+/g, " ").trim();
}

/** Chave para comparar cidades sem acento/maiúsculas ("São Paulo" = "sao paulo"). */
export function cityKey(v: string) {
  return cleanCity(v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Dias que um item fica na lixeira antes de poder ser apagado de vez. */
export const TRASH_DAYS = 90;
