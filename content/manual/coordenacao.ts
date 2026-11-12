import type { ManualChapter } from "./types";

export const COORDENACAO: ManualChapter[] = [
  {
    slug: "painel-da-escola",
    title: "Painel da escola",
    body: `
A coordenação faz tudo o que o professor faz (turmas, alunos, currículo, game jams) e ainda cuida da escola como um todo. O guia do professor vale também para você.

Em **Visão geral** você acompanha:
- **Alunos** cadastrados e **ativos nos últimos 7 dias**.
- **Lições concluídas** nos últimos 30 dias.
- Cada **turma** com o professor, os alunos e a **conclusão** do curso (barra de progresso).
- A **equipe**: turmas, alunos e o último acesso de cada professor.

![Painel da escola](coord-painel)

> Dica: clique no nome de uma turma para abrir o mapa de progresso dela.
`,
  },
  {
    slug: "equipe",
    title: "Convidar professores",
    body: `
1. No menu, abra **Equipe**.
2. Em **Convidar professor(a)**, digite o **Email do(a) professor(a)** e clique em **Convidar**.
3. A pessoa recebe um email com o link para criar a conta. O link também aparece na tela para você copiar e enviar por outro meio, se preferir. Ele vale por 7 dias.

![Tela da equipe com o convite](coord-equipe)

Na mesma tela você vê os **convites pendentes** (e pode cancelá-los) e pode **desativar** um professor que saiu da escola, sem apagar as turmas dele.
`,
  },
  {
    slug: "localizacao",
    title: "Localização da escola",
    body: `
Na **Visão geral**, em **Localização**, informe a **cidade** e o **estado** da escola e clique em **Salvar**.

Isso é usado para avisos regionais e para game jams abertas a escolas de um estado ou de uma cidade.
`,
  },
  {
    slug: "marca",
    title: "Marca da escola",
    body: `
No plano **Escola+**, a plataforma fica com a cara da sua escola: o logo e as cores aparecem no site, nos emails e nos certificados.

1. No menu, abra **Marca**.
2. Defina o **Nome exibido**, a **Cor principal** e a **Cor de destaque**. Ao lado, a **Pré-visualização** mostra como fica.
3. Envie o **Logo** (PNG ou JPG, até 1 MB) e, se quiser, o **Ícone da aba**.
4. Preencha o **Nome do remetente dos emails** e o **Email de suporte**.
5. Clique em **Salvar marca**.

![Editor da marca com pré-visualização](coord-marca)

> Atenção: a cor principal precisa ser escura o bastante para os botões e links serem lidos sobre o fundo branco. A plataforma avisa quando a cor fica clara demais. As cores dos blocos de programação nunca mudam: as crianças aprendem por elas.

## Domínio próprio
Em **Endereço do site** você pode usar um endereço da escola, como codigo.suaescola.com.br:
1. Digite o domínio e clique em **Adicionar domínio**.
2. No painel de DNS do seu domínio, crie o registro mostrado na tela (CNAME).
3. Volte e clique em **Verificar**. Quando aparecer **Ativo**, o endereço já funciona.

> Dica: a mudança de DNS pode levar algumas horas. Se precisar, peça ajuda a quem cuida do site da escola.
`,
  },
];
