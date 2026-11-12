"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { getTenant } from "@/lib/tenant";
import { createSession, deleteSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";

export type LoginState = { error?: string; values?: Record<string, string> } | undefined;

// Hash fixo usado quando o usuário não existe, para o tempo de resposta não revelar isso.
const DUMMY_HASH = "$2b$10$LsKT7GzZ/zqcpHFUOwulrez/55oJZHE4yGixrwC/jU0J2np2ImiT6";

function safeRedirectTarget(target: FormDataEntryValue | null, fallback: string) {
  const t = typeof target === "string" ? target : "";
  return t.startsWith("/") && !t.startsWith("//") ? t : fallback;
}

const staffSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um email válido."),
  password: z.string().min(1, "Informe a senha."),
});

// Mantém o que foi digitado (menos senhas): o React limpa o formulário depois da ação.
function keep(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

export async function loginStaff(_: LoginState, formData: FormData): Promise<LoginState> {
  const values = keep(formData, ["email"]);
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const tenant = await getTenant();
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok || !user.active || user.role === "STUDENT") {
    return { error: "Email ou senha incorretos.", values };
  }
  if (tenant && user.organizationId && user.organizationId !== tenant.id) {
    return { error: "Esta conta não pertence a esta escola.", values };
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ userId: user.id, role: user.role, orgId: user.organizationId });
  redirect(safeRedirectTarget(formData.get("voltar"), ROLE_HOME[user.role]));
}

const studentSchema = z.object({
  classCode: z.string().trim().toUpperCase().min(4, "Digite o código da turma."),
  username: z.string().trim().toLowerCase().min(2, "Digite seu usuário."),
  password: z.string().min(1, "Digite sua senha."),
});

export async function loginStudent(_: LoginState, formData: FormData): Promise<LoginState> {
  const values = keep(formData, ["classCode", "username"]);
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const { classCode, username, password } = parsed.data;
  const genericError = { error: "Código da turma, usuário ou senha incorretos. Peça ajuda ao seu professor!", values };

  const tenant = await getTenant();
  const klass = await db.class.findUnique({ where: { code: classCode } });
  if (!klass || klass.archived || (tenant && klass.organizationId !== tenant.id)) {
    await bcrypt.compare(password, DUMMY_HASH);
    return genericError;
  }

  const user = await db.user.findUnique({
    where: { organizationId_username: { organizationId: klass.organizationId, username } },
    include: { enrollments: { where: { classId: klass.id } } },
  });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active || user.role !== "STUDENT" || user.enrollments.length === 0) {
    return genericError;
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ userId: user.id, role: user.role, orgId: user.organizationId });
  redirect("/aluno");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
