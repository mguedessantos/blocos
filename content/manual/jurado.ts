import type { ManualChapter } from "./types";

export const JURADO: ManualChapter[] = [
  {
    slug: "entrar",
    title: "Entrar e encontrar as jams",
    body: `
Obrigado por ajudar a avaliar! Você recebeu um login da organização da game jam.

1. Abra a plataforma e clique em **Sou professor(a), coordenação ou jurado(a)**.
2. Entre com o **Email** e a **senha padrão** que recebeu.
3. No primeiro acesso, a plataforma pede para você **criar a sua própria senha** (mínimo 8 caracteres).

![Tela para criar a sua senha no primeiro acesso](trocar-senha)

4. No menu, clique em **Avaliar** para ver as jams em que você é jurado(a).

As entregas aparecem para avaliação quando a jam entra na fase **Em julgamento** (logo depois do fim do prazo de entrega).

![Lista de entregas para avaliar](jurado-lista)
`,
  },
  {
    slug: "julgamento-cego",
    title: "Julgamento às cegas",
    body: `
Para ser justo com todas as escolas, você **não vê** de onde vem cada jogo:
- Cada entrega tem só um **código anônimo** (por exemplo, Projeto K7Q2).
- Os arquivos baixados também têm nome anônimo (projeto-K7Q2.sb3).
- As entregas são separadas por **categoria** (faixa de ano escolar). Compare cada jogo só com os da mesma categoria: as crianças têm idades parecidas.
- Se você é de uma escola participante, as entregas da sua escola **não aparecem** para você.

> Atenção: se perceber o nome de uma escola ou de um aluno dentro de um jogo, avalie normalmente e avise a organização.
`,
  },
  {
    slug: "avaliar",
    title: "Avaliar uma entrega",
    body: `
1. Clique em **Projeto XXXX** na lista.
2. Assista ao **vídeo** e leia a **descrição da equipe**.
3. Para jogar, clique em **Jogar aqui**: o jogo abre na própria página, com a bandeira verde. Se preferir, baixe o **projeto** (.sb3) e abra no PictoBlox ou no Scratch. Baixe também a **documentação** para ver as etapas de desenvolvimento.
4. Em **Sua avaliação**, dê uma nota para cada critério (por exemplo, de 0 a 10).
5. Escreva um **comentário para a equipe**: as crianças leem depois do resultado, então capriche no incentivo e em uma dica concreta.
6. Clique em **Salvar avaliação**. Você pode voltar e mudar até o fim do julgamento.

![Tela de avaliação de uma entrega](jurado-avaliar)

![O jogo da equipe aberto na página do jurado](jurado-jogar)

As entregas já avaliadas ganham um ✓ verde na lista. O resultado sai sozinho quando o prazo do julgamento termina.
`,
  },
];
