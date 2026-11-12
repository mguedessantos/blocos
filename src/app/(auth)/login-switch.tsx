"use client";

import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { Island } from "@/components/island";
import { StaffLoginForm, StudentLoginForm } from "./login-forms";

/** Login único: aluno primeiro; um botão troca para professores, coordenação e jurados. */
export function LoginSwitch({ initial, voltar }: { initial: "aluno" | "equipe"; voltar?: string }) {
  const [who, setWho] = useState(initial);
  const staff = who === "equipe";
  return (
    <div className="flex flex-col gap-5">
      {staff ? (
        <span aria-hidden className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-star text-night shadow-[0_5px_0_rgb(0_0_0/0.35)]">
          <GraduationCap className="h-8 w-8" />
        </span>
      ) : (
        <Island index={1} className="flutua mx-auto -mt-16 h-32 w-auto" />
      )}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold">{staff ? "Entrar" : "Oi! Que bom te ver"}</h1>
        <p className="font-semibold text-muted">{staff ? "Professores, coordenação e jurados." : "Use o código da turma que seu professor te passou."}</p>
      </div>
      {staff ? <StaffLoginForm voltar={voltar} /> : <StudentLoginForm />}
      <button
        type="button"
        onClick={() => setWho(staff ? "aluno" : "equipe")}
        className={staff ? "text-center text-sm font-extrabold text-star underline underline-offset-2" : "btn btn-secondary"}
      >
        {staff ? "Sou aluno(a)" : (<><GraduationCap aria-hidden className="h-5 w-5" /> Sou professor(a), coordenação ou jurado(a)</>)}
      </button>
    </div>
  );
}
