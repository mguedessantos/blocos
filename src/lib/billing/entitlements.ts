// Direitos do plano contratado. Toda checagem de recurso pago passa por aqui.
export type Feature = "white_label" | "ai_tutor" | "unlimited_jams";

export type SubStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "READ_ONLY";

type PlanLike = {
  features: string[];
  perSeat?: boolean;
  minSeats?: number;
  maxStudents?: number | null;
  maxClasses?: number | null;
};

export type SubscriptionLike = {
  status: SubStatus;
  trialEndsAt: Date | null;
  seats?: number | null;
  plan: PlanLike;
} | null;

export const TRIAL_DAYS = 14;

export function isSubscriptionUsable(sub: SubscriptionLike, now = new Date()) {
  if (!sub) return false;
  if (sub.status === "ACTIVE" || sub.status === "PAST_DUE") return true; // PAST_DUE = período de carência
  if (sub.status === "TRIAL") return !sub.trialEndsAt || sub.trialEndsAt > now;
  return false;
}

/** Sem assinatura utilizável a conta fica "somente leitura": alunos ainda entram e veem o que fizeram. */
export const canWrite = isSubscriptionUsable;

export function hasFeature(sub: SubscriptionLike, feature: Feature, now = new Date()) {
  return isSubscriptionUsable(sub, now) && sub!.plan.features.includes(feature);
}

/** Máximo de alunos (null = ilimitado). Planos por assento usam a quantidade contratada. */
export function studentLimit(sub: SubscriptionLike): number | null {
  if (!sub) return 0;
  if (sub.plan.perSeat) return sub.seats ?? sub.plan.minSeats ?? 0;
  return sub.plan.maxStudents ?? null;
}

export function classLimit(sub: SubscriptionLike): number | null {
  if (!sub) return 0;
  return sub.plan.maxClasses ?? null;
}

export type LimitCheck = { ok: true } | { ok: false; reason: string };

export function checkCanAddStudents(sub: SubscriptionLike, current: number, adding = 1, now = new Date()): LimitCheck {
  if (!canWrite(sub, now)) return { ok: false, reason: "Sua assinatura não está ativa. Regularize em Assinatura." };
  const limit = studentLimit(sub);
  if (limit !== null && current + adding > limit) {
    return { ok: false, reason: `Seu plano permite ${limit} alunos (você tem ${current}). Aumente os assentos em Assinatura.` };
  }
  return { ok: true };
}

export function checkCanAddClass(sub: SubscriptionLike, current: number, now = new Date()): LimitCheck {
  if (!canWrite(sub, now)) return { ok: false, reason: "Sua assinatura não está ativa. Regularize em Assinatura." };
  const limit = classLimit(sub);
  if (limit !== null && current + 1 > limit) {
    return { ok: false, reason: `Seu plano permite ${limit} turmas. Faça upgrade em Assinatura.` };
  }
  return { ok: true };
}
