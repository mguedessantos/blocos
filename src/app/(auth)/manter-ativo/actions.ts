"use server";

import { redirect } from "next/navigation";
import { keepActive } from "@/lib/dal/retention";

export async function keepActiveAction(token: string) {
  const count = await keepActive(token);
  redirect(count === null ? "/manter-ativo?erro=1" : `/manter-ativo?ok=${count}`);
}
