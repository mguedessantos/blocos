import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { brandFor } from "./branding";
import { db } from "./db";
import { renderEmail, type EmailBrand, type EmailContent } from "./email-template";
import { tenantUrl } from "./url";

export type { EmailBrand, EmailContent };

// Emails transacionais com a marca da escola. Com RESEND_API_KEY envia pela Resend;
// sem a chave (desenvolvimento) grava o email em .data/outbox para conferência.

/** Marca usada nos emails de uma organização (respeita o plano: sem white-label → marca padrão). */
export async function emailBrandFor(organizationId: string): Promise<EmailBrand> {
  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId }, include: { branding: true, subscription: { include: { plan: true } } } });
  const b = brandFor(org);
  const base = tenantUrl(org.slug);
  return {
    name: b.name,
    primary: b.primary,
    primaryText: b.primaryText,
    logoUrl: b.logoUrl ? (b.logoUrl.startsWith("/") ? `${base}${b.logoUrl}` : b.logoUrl) : null,
    senderName: (b.whiteLabel && org.branding?.emailSenderName) || b.name,
    replyTo: (b.whiteLabel && org.branding?.supportEmail) || null,
    showPlatform: b.showPlatformBrand,
  };
}

export async function sendEmail(to: string, brand: EmailBrand, content: EmailContent): Promise<{ sent: boolean }> {
  const msg = renderEmail(brand, content);
  const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? `no-reply@${(process.env.ROOT_DOMAIN ?? "localhost").split(":")[0]}`;
  const from = `${brand.senderName.replace(/[<>"]/g, "")} <${fromAddress}>`;
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: msg.subject, html: msg.html, text: msg.text, ...(brand.replyTo ? { reply_to: brand.replyTo } : {}) }),
    });
    if (!res.ok) console.error("Falha ao enviar email", res.status);
    return { sent: res.ok };
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("RESEND_API_KEY não configurada: email não enviado.");
    return { sent: false };
  }
  const dir = path.resolve(".data/outbox");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${Date.now()}-${randomUUID().slice(0, 8)}.json`), JSON.stringify({ from, to, replyTo: brand.replyTo, ...msg }, null, 2));
  return { sent: true };
}
