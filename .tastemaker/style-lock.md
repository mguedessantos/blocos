# Style lock — Blocos · área do aluno "Noite estrelada"

Escolhido pelo usuário em 2026-11-12 (opção C de 3). Referências: `referencias/*.png` (mapa de capítulos com ilhas isométricas,
lista numerada em hexágonos, faixas "Concluído", CTA "Continuar", editor com categorias em ícones redondos).
Extraído das referências: azuis #2555A6–#539DE5 (>80% dos pixels), navy da barra, amarelo das faixas, rosa do CTA.
Direção: a ESTRUTURA vem das referências; a COR é noite (espaço) por escolha do usuário. Não copiar arte/marca de terceiros.

## Escopo
- Tema noturno: área do aluno (/aluno, trilhas, lições) e login. Professores/coordenação continuam claros (fase seguinte).
- Marca da escola: logo e nome continuam no topo; no tema noturno as cores da interface são fixas (cores de escola escuras somem no fundo noturno).

## Color contract (verificado com check_contrast.py)
| papel | hex | uso |
|---|---|---|
| bg (céu) | #0D0B2A | fundo da página; topo do degradê |
| bg-2 | #24164F | base do degradê do mapa |
| surface | #1B1745 | cards, painéis, barra do topo |
| border | #3A3375 | bordas e divisórias |
| text | #F4F1FF | texto principal |
| muted | #B9B2E6 | texto secundário (9.6:1 no bg, 8.4:1 no surface) |
| violet (primary) | #8B6CFF | brilhos, contornos, texto de destaque no escuro (5.18:1 no bg) |
| violet-fill | #7A55F5 | fundo de botão com texto branco (4.72:1) |
| star (accent) | #FFD84D | faixas "Concluído", estrelas, XP — texto #0D0B2A (13.8:1) |
| cta (rosa) | #FF5C8A | "Continuar"/"Próxima lição" — texto #0D0B2A (6.51:1). NUNCA texto branco (2.94:1) |
| go (verde) | #2BD39E | "Executar" — texto #0D0B2A |
| stop | #FF6B6B | "Parar" — texto #0D0B2A |

Proibido: branco sobre #8B6CFF (3.69), branco sobre #FF5C8A (2.94), branco sobre #138A6E (4.30).

## Tipo
Baloo 2 (títulos, números) + Nunito (texto). Mantidas: arredondadas e legíveis para 8–14 anos.

## Forma
Cantos 20–28px nos cards; botões "apertáveis" com base escura de 4px; hexágono para o número das lições;
faixa diagonal amarela "Concluído". Ilhas isométricas em SVG original, uma por mundo.

## Movimento
Estrelas piscando e ilhas flutuando bem devagar (6–9s), só com prefers-reduced-motion: no-preference.
Interações: 150–200ms ease-out. Sem animação de layout.

## Editor de blocos
Moldura escura, área de trabalho clara (as crianças leem os blocos no claro). Categorias como círculos coloridos com ícone e nome embaixo.
