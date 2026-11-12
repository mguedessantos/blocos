import Link from "next/link";

export default function SemAcessoPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-extrabold">Ops! Essa área não é sua 🚧</h1>
      <p className="text-muted">Sua conta não tem permissão para acessar esta página.</p>
      <Link href="/" className="font-bold text-brand underline">Voltar para o início</Link>
    </main>
  );
}
