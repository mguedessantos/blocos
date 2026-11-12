"use client";

import { useActionState, useRef, useState } from "react";
import { CredentialCards } from "@/components/credential-cards";
import { Alert, Button } from "@/components/ui";
import {
  addStudentsAction,
  deleteStudentAction,
  renameClassAction,
  resetPasswordsAction,
  setStudentActiveAction,
} from "../../actions";

type CardInfo = { brandName: string; logoUrl: string | null; loginUrl: string; classCode: string; className: string };

export function AddStudentsForm({ classId, card }: { classId: string; card: CardInfo }) {
  const [state, action, pending] = useActionState(addStudentsAction.bind(null, classId), undefined);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadFile(file: File | undefined) {
    if (file) setText(await file.text());
  }

  if (state?.credentials) {
    return (
      <div className="space-y-3">
        <p className="no-print font-bold text-green-800">✅ {state.credentials.length} aluno(s) criado(s)!</p>
        {state.warnings && state.warnings.length > 0 && (
          <ul className="no-print text-sm text-amber-800">{state.warnings.map((w) => <li key={w}>⚠️ {w}</li>)}</ul>
        )}
        <CredentialCards credentials={state.credentials} {...card} />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm font-semibold" htmlFor="names">
        Nomes dos alunos (um por linha — só o primeiro nome ou apelido)
      </label>
      <textarea
        id="names"
        name="names"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Ana\nBruno\nClara"}
        className="w-full rounded-xl border-2 border-black/10 p-3 focus:border-brand"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={pending}>{pending ? "Criando..." : "Criar alunos e gerar senhas"}</Button>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-semibold text-brand underline">
          ou importar arquivo CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" aria-label="Arquivo CSV" onChange={(e) => loadFile(e.target.files?.[0])} />
      </div>
      <p className="text-xs text-muted">CSV: uma coluna &quot;nome&quot; (outras colunas são ignoradas). Não inclua email, telefone ou documentos dos alunos.</p>
      {state?.error && <Alert>{state.error}</Alert>}
    </form>
  );
}

type Student = { id: string; name: string; username: string | null; active: boolean; lastLoginAt: Date | null; xp: number };

export function StudentsTable({ classId, students, card }: { classId: string; students: Student[]; card: CardInfo }) {
  const [state, action, pending] = useActionState(resetPasswordsAction.bind(null, classId), undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (students.length === 0) return <p className="text-muted">Nenhum aluno ainda. Adicione abaixo. 👇</p>;

  return (
    <div className="space-y-4">
      <form action={action} className="no-print space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="w-8 py-2">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todos"
                    checked={selected.size === students.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(students.map((s) => s.id)) : new Set())}
                  />
                </th>
                <th>Nome</th><th>Usuário</th><th>XP</th><th>Último acesso</th><th>Situação</th><th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className={`border-t border-black/5 ${s.active ? "" : "text-black/40"}`}>
                  <td className="py-2">
                    <input type="checkbox" name="studentId" value={s.id} aria-label={`Selecionar ${s.name}`} checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                  </td>
                  <td className="font-semibold">{s.name}</td>
                  <td className="font-mono">{s.username}</td>
                  <td>{s.xp}</td>
                  <td>{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString("pt-BR") : "nunca"}</td>
                  <td>{s.active ? "Ativo" : "Desativado"}</td>
                  <td className="space-x-2 text-right whitespace-nowrap">
                    <button type="button" className="font-semibold text-brand underline" onClick={() => setStudentActiveAction(classId, s.id, !s.active)}>
                      {s.active ? "Desativar" : "Reativar"}
                    </button>
                    <a href={`/professor/alunos/${s.id}/exportar`} className="font-semibold text-brand underline">Exportar</a>
                    <button
                      type="button"
                      className="font-semibold text-red-700 underline"
                      onClick={() => {
                        if (confirm(`Excluir ${s.name} definitivamente? Todo o progresso e projetos serão apagados (LGPD).`)) {
                          deleteStudentAction(classId, s.id);
                        }
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button disabled={pending || selected.size === 0} className="text-sm">
          {pending ? "Gerando..." : `🔑 Gerar novas senhas e cartões (${selected.size})`}
        </Button>
        {state?.error && <Alert>{state.error}</Alert>}
      </form>
      {state?.credentials && <CredentialCards credentials={state.credentials} {...card} />}
    </div>
  );
}

export function RenameClassForm({ classId, name }: { classId: string; name: string }) {
  const [state, action, pending] = useActionState(renameClassAction.bind(null, classId), undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Nome da turma
        <input name="name" defaultValue={name} className="rounded-xl border-2 border-black/10 px-3 py-2 font-normal" />
      </label>
      <Button disabled={pending} className="py-2 text-sm">Salvar</Button>
      {state?.error && <Alert>{state.error}</Alert>}
    </form>
  );
}
