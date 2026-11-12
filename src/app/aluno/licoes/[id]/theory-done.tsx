"use client";

import { useActionState } from "react";
import { Alert, Button } from "@/components/ui";
import { completeTheoryAction } from "./actions";

export function TheoryDone({ lessonId, done }: { lessonId: string; done: boolean }) {
  const [state, action, pending] = useActionState(completeTheoryAction.bind(null, lessonId), {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending} className="text-lg">{pending ? "Salvando…" : done ? "Continuar →" : "Entendi! Próxima →"}</Button>
    </form>
  );
}
