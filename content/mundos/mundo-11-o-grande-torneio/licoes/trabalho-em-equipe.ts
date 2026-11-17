import type { LessonContent } from "../../tipos";

export const licao: LessonContent = {
  slug: "trabalho-em-equipe",
  title: "Trabalho em equipe",
  type: "TEORIA",
  xp: 10,
  content: `# Ninguém cria um jogo sozinho

Em uma jam, cada pessoa da equipe tem um **papel** (e todo mundo ajuda em tudo!):

- **Programação**: monta os scripts principais.
- **Arte e cenários**: escolhe atores, fantasias e cenários e cuida da aparência.
- **Som**: escolhe os sons e quando eles tocam.
- **Design e testes**: cuida das regras, da dificuldade e testa tudo.

## Piloto e copiloto

A equipe trabalha em **um projeto só**. Quem está no teclado é o **piloto**; quem está ao lado é o **copiloto**, que lê a ficha do jogo, confere os blocos e dá ideias. **Troquem de lugar a cada 10 minutos!**

## Combinados da equipe

- Combinem os **nomes das mensagens e variáveis** antes de começar (ex.: “começar”, “fim”, “pontos”).
- Cada ator pode ter um “dono”, mas todos revisam o código de todos.`,
  guide: {
    objetivo: "Organizar papéis, rodízio no teclado e combinados de nomes.",
    minutos: 20,
    passos: ["Forme as equipes (3 ou 4 alunos) e peça que escolham papéis.", "Use um cronômetro visível para o rodízio piloto/copiloto."],
    errosComuns: ["Um aluno dominando o teclado o tempo todo: reforce o rodízio.", "Mensagens com nomes diferentes em atores feitos por pessoas diferentes."],
  },
};
