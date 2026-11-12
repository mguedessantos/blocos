"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { TRIAL_DAYS } from "@/lib/billing/entitlements";
import { cleanCity, isUF } from "@/lib/br";
import { db } from "@/lib/db";
import { clientIp, hit, LIMITS } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { slugError } from "@/lib/slug";
import { getTenant } from "@/lib/tenant";

export type SignupValues = Partial<Record<"type" | "orgName" | "slug" | "city" | "state" | "name" | "email" | "accept", string>>;
export type SignupState = { error?: string; field?: string; values?: SignupValues } | undefined;

const CONSENT_DOCUMENTS = ["termos-v1", "privacidade-v1", "dpa-v1"];

const schema = z.object({
  type: z.enum(["ESCOLA", "PROFESSOR_INDEPENDENTE"]),
  orgName: z.string().trim().min(2, "Informe o nome da escola ou da sua conta.").max(80),
  slug: z.string().trim().toLowerCase(),
  city: z.string().transform(cleanCity).pipe(z.string().min(2, "Informe a cidade.").max(80)),
  state: z.string().refine(isUF, "Escolha o estado."),
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.string().trim().toLowerCase().email("Informe um email válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(200),
  accept: z.literal("on", { message: "É preciso aceitar os Termos de Uso e a Política de Privacidade." }),
});

// Plano usado durante o teste grátis: escolas experimentam o Escola+ completo.
const TRIAL_PLAN = { ESCOLA: "escola_plus", PROFESSOR_INDEPENDENTE: "professor" } as const;

export async function signup(_: SignupState, formData: FormData): Promise<SignupState> {
  // Devolvemos o que foi digitado (menos a senha): o React limpa o formulário após a ação.
  const values: SignupValues = {};
  for (const k of ["type", "orgName", "slug", "city", "state", "name", "email", "accept"] as const) {
    const v = formData.get(k);
    if (typeof v === "string") values[k] = v;
  }
  const fail = (error: string, field?: string): SignupState => ({ error, field, values });

  if (await getTenant()) return fail("O cadastro é feito no site principal.");
  const limited = await hit("cadastro-ip", await clientIp(), ...LIMITS.signupPerIp);
  if (!limited.ok) return fail(`Muitos cadastros seguidos deste local. Tente de novo em ${limited.retryInMin} minuto(s).`);

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue.message, String(issue.path[0]));
  }
  const data = parsed.data;

  const slugProblem = slugError(data.slug);
  if (slugProblem) return fail(slugProblem, "slug");

  const [emailTaken, slugTaken] = await Promise.all([
    db.user.findUnique({ where: { email: data.email }, select: { id: true } }),
    db.organization.findUnique({ where: { slug: data.slug }, select: { id: true } }),
  ]);
  if (emailTaken) return fail("Já existe uma conta com este email. Tente entrar.", "email");
  if (slugTaken) return fail("Este endereço já está em uso. Escolha outro.", "slug");

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const passwordHash = await bcrypt.hash(data.password, 10);

  let user;
  try {
    user = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.orgName,
          slug: data.slug,
          type: data.type,
          city: data.city,
          state: data.state,
          subscription: {
            create: {
              planId: TRIAL_PLAN[data.type],
              status: "TRIAL",
              trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
            },
          },
        },
      });
      const admin = await tx.user.create({
        data: { role: "ORG_ADMIN", name: data.name, email: data.email, passwordHash, organizationId: org.id },
      });
      await tx.consentRecord.createMany({
        data: CONSENT_DOCUMENTS.map((document) => ({ organizationId: org.id, userId: admin.id, document, ip })),
      });
      await tx.auditLog.create({
        data: { organizationId: org.id, actorId: admin.id, action: "organizacao.criar", target: org.slug },
      });
      return admin;
    });
  } catch {
    // corrida rara: email/endereço criado entre a checagem e a transação
    return fail("Não foi possível criar a conta. Verifique o email e o endereço e tente de novo.");
  }

  await createSession({ userId: user.id, role: user.role, orgId: user.organizationId });
  redirect("/escola?bem-vindo=1");
}
