// Modelo HTML dos emails com a marca da escola (puro: testável sem banco).

export type EmailBrand = { name: string; primary: string; primaryText: string; logoUrl: string | null; senderName: string; replyTo: string | null; showPlatform: boolean };

const PLATFORM = process.env.PLATFORM_NAME ?? "Blocos";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type EmailContent = { subject: string; heading: string; paragraphs: string[]; button?: { label: string; url: string }; footnote?: string };

/** HTML simples, com estilos inline (clientes de email ignoram CSS externo). */
export function renderEmail(brand: EmailBrand, c: EmailContent) {
  const header = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.name)}" height="40" style="height:40px;width:auto;border:0">`
    : `<span style="font:800 22px Arial,sans-serif;color:${brand.primary}">${esc(brand.name)}</span>`;
  const button = c.button
    ? `<p style="margin:28px 0"><a href="${esc(c.button.url)}" style="background:${brand.primary};color:${brand.primaryText};text-decoration:none;font:700 16px Arial,sans-serif;padding:14px 24px;border-radius:12px;display:inline-block">${esc(c.button.label)}</a></p>
       <p style="font:13px Arial,sans-serif;color:#64748b">Se o botão não funcionar, copie este endereço: <br><span style="word-break:break-all">${esc(c.button.url)}</span></p>`
    : "";
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f2fb;padding:24px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:16px;border-top:6px solid ${brand.primary}">
    <tr><td style="padding:24px 28px 0">${header}</td></tr>
    <tr><td style="padding:16px 28px 28px">
      <h1 style="font:800 22px Arial,sans-serif;color:#1f1d2b;margin:8px 0 16px">${esc(c.heading)}</h1>
      ${c.paragraphs.map((p) => `<p style="font:16px/1.5 Arial,sans-serif;color:#1f1d2b;margin:0 0 12px">${esc(p)}</p>`).join("")}
      ${button}
      ${c.footnote ? `<p style="font:13px Arial,sans-serif;color:#64748b;margin-top:24px">${esc(c.footnote)}</p>` : ""}
    </td></tr>
  </table>
  ${brand.showPlatform ? `<p style="font:12px Arial,sans-serif;color:#94a3b8">com tecnologia ${esc(PLATFORM)}</p>` : ""}
  </td></tr></table></body></html>`;
  const text = [c.heading, "", ...c.paragraphs, ...(c.button ? ["", `${c.button.label}: ${c.button.url}`] : []), ...(c.footnote ? ["", c.footnote] : [])].join("\n");
  return { subject: c.subject, html, text };
}

