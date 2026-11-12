export type ManualChapter = { slug: string; title: string; body: string };
export type ManualGuide = { slug: "professor" | "coordenacao" | "jurado"; title: string; intro: string; chapters: ManualChapter[] };
