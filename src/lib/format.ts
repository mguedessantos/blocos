const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" });

export const formatBRL = (cents: number) => brl.format(cents / 100);
export const formatDate = (d: Date) => date.format(d);
