"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, Button, Input } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { signup } from "./actions";

const TYPES = [
  { value: "ESCOLA", label: "🏫 Escola", hint: "Vários professores" },
  { value: "PROFESSOR_INDEPENDENTE", label: "🍎 Professor(a)", hint: "Aulas particulares ou cursos" },
] as const;

export function SignupForm({ rootDomain }: { rootDomain: string }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("ESCOLA");
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-1 text-sm font-semibold">Quem vai usar?</legend>
        {TYPES.map((t) => (
          <label
            key={t.value}
            className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${type === t.value ? "border-brand bg-brand/5" : "border-black/10"}`}
          >
            <input
              type="radio"
              name="type"
              value={t.value}
              checked={type === t.value}
              onChange={() => setType(t.value)}
              className="sr-only"
            />
            <span className="block font-bold">{t.label}</span>
            <span className="text-black/50">{t.hint}</span>
          </label>
        ))}
      </fieldset>

      <Input
        label={type === "ESCOLA" ? "Nome da escola" : "Nome da sua conta (ex.: Turmas da Ana)"}
        name="orgName"
        value={orgName}
        onChange={(e) => {
          setOrgName(e.target.value);
          if (!slugEdited) setSlug(slugify(e.target.value));
        }}
        required
      />
      <div>
        <Input
          label="Endereço"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value.toLowerCase());
          }}
          required
        />
        <p className="mt-1 text-xs text-black/50">
          Seus alunos vão entrar por <strong>{slug || "seu-endereco"}.{rootDomain}</strong>
        </p>
      </div>
      <Input label="Seu nome" name="name" autoComplete="name" defaultValue={state?.values?.name} required />
      <Input label="Seu email" name="email" type="email" autoComplete="email" defaultValue={state?.values?.email} required />
      <Input
        label="Crie uma senha (mín. 8 caracteres)"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept" className="mt-1" defaultChecked={state?.values?.accept === "on"} required />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-semibold text-brand underline">Termos de Uso</Link>, a{" "}
          <Link href="/privacidade" target="_blank" className="font-semibold text-brand underline">Política de Privacidade</Link>{" "}
          e o acordo de tratamento de dados dos alunos (LGPD).
        </span>
      </label>

      {state?.error && <Alert>{state.error}</Alert>}
      <Button disabled={pending}>{pending ? "Criando conta..." : "Começar teste grátis de 14 dias"}</Button>
      <p className="text-center text-xs text-black/50">Sem cartão de crédito para testar.</p>
    </form>
  );
}
