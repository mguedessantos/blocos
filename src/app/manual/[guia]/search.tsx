"use client";

/** Filtra os capítulos pelo texto (título ou conteúdo), direto na página. */
export function ManualSearch() {
  function onInput(q: string) {
    const term = q.trim().toLowerCase();
    let shown = 0;
    document.querySelectorAll<HTMLElement>("section[data-capitulo]").forEach((s) => {
      const hit = !term || s.innerText.toLowerCase().includes(term);
      s.hidden = !hit;
      if (hit) shown++;
      const link = document.querySelector<HTMLElement>(`li[data-capitulo="${s.dataset.capitulo}"]`);
      if (link) link.hidden = !hit;
    });
    const none = document.getElementById("sem-resultados");
    if (none) none.hidden = shown > 0;
  }
  return (
    <label className="block">
      <span className="sr-only">Buscar no manual</span>
      <input type="search" placeholder="Buscar no manual…" onInput={(e) => onInput(e.currentTarget.value)}
        className="w-full rounded-xl border-2 border-line bg-transparent px-3 py-2 font-semibold" />
    </label>
  );
}
