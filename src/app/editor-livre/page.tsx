import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FullWindow } from "@/app/jams/[slug]/equipes/[teamId]/estudio/full-window";
import { requireUser } from "@/lib/dal/auth";
import { FreeEditor } from "./free-editor";

export const metadata = { title: "Editor livre" };

const HOME = { STUDENT: "/aluno", TEACHER: "/professor", ORG_ADMIN: "/escola" } as const;

export default async function EditorLivrePage() {
  const user = await requireUser(["STUDENT", "TEACHER", "ORG_ADMIN"]);
  return (
    <FullWindow>
      <div className="flex flex-wrap items-center gap-3 border-b-2 border-line bg-surface px-4 py-2">
        <Link href={HOME[user.role as keyof typeof HOME]} className="inline-flex items-center gap-1 text-sm font-extrabold text-muted hover:text-foreground">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="text-xl font-extrabold">Editor livre</h1>
        <span className="text-sm font-bold text-muted">Todos os blocos e o simulador completo, sem missão.</span>
      </div>
      <div className="min-h-0 flex-1">
        <FreeEditor />
      </div>
    </FullWindow>
  );
}
