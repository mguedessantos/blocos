"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { changePassword } from "../actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Nova senha (mínimo 8 caracteres)" name="password" type="password" autoComplete="new-password" minLength={8} required />
      <Input label="Repita a nova senha" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      {state?.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending}>{pending ? "Salvando..." : "Salvar e continuar"}</Button>
    </form>
  );
}
