"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { loginStaff, loginStudent } from "./actions";

export function StaffLoginForm({ voltar }: { voltar?: string }) {
  const [state, action, pending] = useActionState(loginStaff, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {voltar && <input type="hidden" name="voltar" value={voltar} />}
      <Input label="Email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      <Input label="Senha" name="password" type="password" autoComplete="current-password" required />
      {state?.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending}>{pending ? "Entrando..." : "Entrar"}</Button>
    </form>
  );
}

export function StudentLoginForm() {
  const [state, action, pending] = useActionState(loginStudent, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="🏫 Código da turma" name="classCode" autoCapitalize="characters" autoComplete="off" placeholder="EX: ROBO42" defaultValue={state?.values?.classCode} required />
      <Input label="🙂 Seu usuário" name="username" autoCapitalize="none" autoComplete="username" defaultValue={state?.values?.username} required />
      <Input label="🔑 Sua senha" name="password" type="password" autoComplete="current-password" required />
      {state?.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending} className="text-lg">{pending ? "Entrando..." : "Vamos lá! 🚀"}</Button>
    </form>
  );
}
