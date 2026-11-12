"use client";

import type { IssuedCredential } from "@/lib/dal/classes";

type Props = {
  credentials: IssuedCredential[];
  brandName: string;
  logoUrl: string | null;
  loginUrl: string;
  classCode: string;
  className: string;
};

/** Cartões de acesso para recortar. As senhas só existem aqui — não ficam guardadas em texto. */
export function CredentialCards({ credentials, brandName, logoUrl, loginUrl, classCode, className }: Props) {
  return (
    <div className="space-y-3">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        <p>
          <strong>Anote ou imprima agora:</strong> por segurança, as senhas não ficam guardadas e não aparecem de novo.
          Se perder, gere novas senhas.
        </p>
        <button onClick={() => window.print()} className="btn">
          🖨️ Imprimir cartões
        </button>
      </div>
      <div className="print-area grid grid-cols-1 gap-3 sm:grid-cols-2 print:grid-cols-2">
        {credentials.map((c) => (
          <div key={c.id} className="break-inside-avoid rounded-2xl border-2 border-dashed border-black/30 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo do cliente */}
              {logoUrl && <img src={logoUrl} alt="" className="h-6 w-auto" />}
              <span className="font-extrabold">{brandName}</span>
              <span className="ml-auto text-xs text-muted">{className}</span>
            </div>
            <p className="text-lg font-extrabold">Oi, {c.name}! 👋</p>
            <p className="text-xs text-muted">Entre em: <strong>{loginUrl.replace(/^https?:\/\//, "")}</strong></p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 font-mono text-base">
              <dt className="font-sans text-sm text-muted">🏫 Turma</dt><dd className="font-bold">{classCode}</dd>
              <dt className="font-sans text-sm text-muted">🙂 Usuário</dt><dd className="font-bold">{c.username}</dd>
              <dt className="font-sans text-sm text-muted">🔑 Senha</dt><dd className="font-bold">{c.password}</dd>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
