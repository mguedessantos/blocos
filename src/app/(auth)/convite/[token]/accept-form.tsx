"use client";

import { useActionState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { acceptInviteAction } from "./actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptInviteAction.bind(null, token), undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="Seu nome" name="name" autoComplete="name" defaultValue={state?.name} required />
      <Input label="Crie uma senha (mín. 8 caracteres)" name="password" type="password" autoComplete="new-password" minLength={8} required />
      {state?.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending}>{pending ? "Criando conta..." : "Criar conta"}</Button>
    </form>
  );
}
