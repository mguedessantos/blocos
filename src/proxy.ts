import { NextResponse, type NextRequest } from "next/server";
import { parseHost } from "@/lib/host";
import { AREA_ROLES, areaFor } from "@/lib/roles";
import { SESSION_COOKIE, decryptSession } from "@/lib/session-token";

// Checagem otimista (só o cookie). A checagem definitiva fica em requireUser() em cada página/ação.
export async function proxy(request: NextRequest) {
  // Página inicial pública (HTML estático em public/inicio, isolado do CSS do app): só no domínio da
  // plataforma e sem sessão. Logado ou no domínio de uma escola, o app/page.tsx decide (painel ou escolha de entrada).
  if (request.nextUrl.pathname === "/") {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
    const root = parseHost(host, process.env.ROOT_DOMAIN ?? "localhost:3000").kind === "root";
    if (root && !(await decryptSession(request.cookies.get(SESSION_COOKIE)?.value))) {
      return NextResponse.rewrite(new URL("/inicio/index.html", request.url));
    }
    return NextResponse.next();
  }
  const area = areaFor(request.nextUrl.pathname);
  if (!area) return NextResponse.next();

  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const login = area === "/aluno" ? "/entrar" : "/entrar?perfil=equipe";
    const url = new URL(login, request.url);
    url.searchParams.set("voltar", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (!AREA_ROLES[area].includes(session.role)) {
    return NextResponse.redirect(new URL("/sem-acesso", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/plataforma/:path*", "/escola/:path*", "/professor/:path*", "/aluno/:path*", "/jurado/:path*", "/jams/:path*", "/manual/:path*"],
};
