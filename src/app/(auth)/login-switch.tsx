"use client";

import { Gamepad2, GraduationCap } from "lucide-react";
import { useState } from "react";
import { StaffLoginForm, StudentLoginForm } from "./login-forms";

/** Login único: aluno primeiro; um botão troca para professores, coordenação e jurados. */
export function LoginSwitch({ initial, voltar }: { initial: "aluno" | "equipe"; voltar?: string }) {
  const [who, setWho] = useState(initial);
  const staff = who === "equipe";
  return (
    <div className="flex flex-col gap-5">
      <span
        aria-hidden
        className={`mx-auto grid h-16 w-16 place-items-center rounded-3xl ${staff ? "bg-foreground text-white shadow-[0_5px_0_rgb(0_0_0/0.3)]" : "bg-brand text-brand-text shadow-[0_5px_0_var(--brand-shadow)]"}`}
      >
        {staff ? <GraduationCap className="h-8 w-8" /> : <Gamepad2 className="h-8 w-8" />}
      </span>
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">{staff ? "Entrar" : "Oi! Que bom te ver"}</h1>
        <p className="font-semibold text-muted">{staff ? "Professores, coordenação e jurados." : "Use o código da turma que seu professor te passou."}</p>
      </div>
      {staff ? <StaffLoginForm voltar={voltar} /> : <StudentLoginForm />}
      <button
        type="button"
        onClick={() => setWho(staff ? "aluno" : "equipe")}
        className={staff ? "text-center text-sm font-extrabold text-brand underline underline-offset-2" : "btn btn-secondary"}
      >
        {staff ? "Sou aluno(a)" : (<><GraduationCap aria-hidden className="h-5 w-5" /> Sou professor(a), coordenação ou jurado(a)</>)}
      </button>
    </div>
  );
}
