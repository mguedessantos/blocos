import type { ManualChapter } from "./types";

// Guia do(a) professor(a). Imagens: ![descrição](id) → public/manual/<id>.png (npm run manual:capturas).
// Caixas: "> Dica: ..." e "> Atenção: ...".

export const PROFESSOR: ManualChapter[] = [
  {
    slug: "primeiro-acesso",
    title: "Primeiro acesso",
    body: `
Bem-vindo(a) à plataforma! Aqui seus alunos aprendem programação em blocos, primeiro no próprio site e depois levando os projetos para o PictoBlox. Você acompanha tudo de perto.

## Como entrar
1. Abra o endereço da plataforma (ou o endereço da sua escola).
2. A tela de entrada começa pelo login dos alunos. Clique em **Sou professor(a), coordenação ou jurado(a)**.
3. Digite seu **Email** e sua **Senha** e clique em **Entrar**.

![Tela de entrada com o botão para professores](login)

> Dica: no primeiro acesso com a senha padrão, a plataforma pede para você criar a sua própria senha. Para trocar depois, use o ícone de **chave** no topo. Esqueceu? Peça ao suporte para voltar à senha padrão.

## O menu
No topo da página ficam os atalhos:
- **Minhas turmas**: suas turmas e alunos.
- **Mundos e aulas**: os mesmos mundos que os alunos veem, com o guia do professor e o botão **Dar aula** em cada lição.
- O ícone de **chave** troca a sua senha.
- **Game Jam**: competições de jogos entre escolas.
- O ícone de **boia** abre este manual (com o botão **Baixar PDF**).
- O **sino** mostra avisos da plataforma (um número vermelho indica avisos novos).
- **Sair** encerra sua sessão. Use sempre em computadores compartilhados.

![Página inicial do professor](prof-inicio)
`,
  },
  {
    slug: "turmas",
    title: "Turmas",
    body: `
Cada turma tem um **código** (por exemplo, ROBO42). Os alunos usam esse código para entrar, junto com o usuário e a senha deles.

## Criar uma turma
1. Em **Minhas turmas**, digite o nome em **Nome da nova turma** (ex.: 5º ano B).
2. Clique em **+ Criar turma**.
3. A página da turma abre com o código em destaque.

![Página da turma com o código](prof-turma)

## Renomear ou arquivar
No fim da página da turma, em **Configurações da turma**, você pode trocar o nome ou **arquivar** a turma.

> Atenção: depois de arquivada, os alunos não conseguem mais entrar com aquele código. O progresso deles fica guardado.
`,
  },
  {
    slug: "alunos",
    title: "Alunos e cartões de login",
    body: `
Os alunos **não precisam de email**. Você cria as contas e a plataforma gera um usuário e uma senha simples para cada um.

## Cadastrar alunos
1. Na página da turma, vá até **Adicionar alunos**.
2. Digite um nome por linha (ou importe um arquivo CSV com uma coluna "nome").
3. Clique em **Criar alunos e gerar senhas**.
4. Aparecem os **cartões de login** com o código da turma, o usuário e a senha de cada aluno. Clique em **Imprimir cartões** e entregue um para cada criança.

![Cartões de login gerados para a turma](prof-cartoes)

> Dica: use só o primeiro nome ou um apelido. A plataforma foi feita para guardar o mínimo de dados das crianças (LGPD).

## Aluno esqueceu a senha
Na lista **Alunos**, marque o(s) aluno(s) e clique em **Gerar novas senhas e cartões**. As senhas antigas deixam de funcionar.

## Outras ações
- **Desativar**: o aluno não consegue entrar, mas nada é apagado. **Reativar** desfaz.
- **Excluir**: apaga a conta e todo o progresso para sempre.
- **Exportar**: baixa os dados do aluno (útil se a família pedir, conforme a LGPD).
`,
  },
  {
    slug: "curriculo",
    title: "Mundos, aulas e cursos",
    body: `
O curso **PictoBlox e Introdução à Programação de Blocos** tem 10 mundos em três níveis: Básico, Intermediário e Avançado. Cada mundo tem lições no site e uma missão extra opcional no PictoBlox.

![Página do currículo com os mundos por nível](prof-curriculo)

## Liberar o curso para a turma
O curso é liberado **inteiro** para a turma (não trilha por trilha).
1. Abra a página da turma.
2. Em **Cursos da turma**, clique em **Liberar curso**.
3. Pronto: os alunos já veem os mundos ao entrar. Para tirar o acesso, clique em **✓ Liberado (remover)**.

![Liberar o curso na página da turma](prof-cursos)

## Guia do professor
Em **Mundos e aulas**, abra qualquer mundo para ver todas as lições com o **guia do professor**: objetivo, como conduzir a aula, erros comuns e como ajudar.

## Dar aula resolvendo junto
No mundo, clique em **Começar a aula deste mundo** ou em **Dar aula** numa lição. Ela abre exatamente como o aluno vê, com o editor de blocos, para você resolver na projeção junto com a turma.
- As setas ao lado do título passam para a lição anterior ou a próxima.
- **Verificar** mostra as estrelas e as dicas, mas **não grava** nada: o seu progresso e o dos alunos não mudam.
- O **Guia do professor** fica fechado no fim da coluna da direita; abra quando precisar.

![Guia do professor de uma trilha](prof-guia)

> Dica: cursos marcados como **Em breve** ainda estão em preparação e não podem ser liberados.
`,
  },
  {
    slug: "como-o-aluno-aprende",
    title: "Como o aluno aprende",
    body: `
## A tela do aluno
O aluno vê os mundos liberados, o próprio nível, o XP e as medalhas. O botão **Começar** (ou **Continuar**) leva direto para a próxima lição.

![Tela inicial do aluno](aluno-trilhas)

## A lição
- **Teoria**: o aluno lê e clica em **Entendi! Próxima →**.
- **Exercícios e desafios**: abrem no editor de blocos, com a mesma cara do Scratch e do PictoBlox. Assim o aluno já aprende na ferramenta que vai usar nas game jams.
- As lições abrem em sequência: a próxima libera quando a anterior é concluída.

![Lição no editor de blocos](aluno-licao)

## O editor de blocos
A tela ocupa a janela inteira, sem precisar rolar:
- **À esquerda, o editor**: as categorias de blocos, a área onde o aluno monta o programa, o palco com a **bandeira verde** (roda o programa) e o **botão vermelho** (para), e a lista de atores e cenários.
- **Abas Código, Fantasias e Sons**: o aluno pode desenhar fantasias, mudar cores e gravar ou escolher sons, como no Scratch.
- **Escolher um ator ou cenário**: mostra primeiro os personagens da plataforma e depois os da biblioteca do editor (pessoas, animais, esportes e mais).
- **À direita**: a missão, o **Desafio extra (opcional)** e o botão **Verificar**.
- No topo: **Recomeçar** (volta ao projeto inicial da lição) e **Como funciona cada bloco**.

> Dica: em cada lição, a paleta mostra só os blocos que aquela lição ensina. Os outros aparecem nos mundos seguintes.

O projeto fica guardado sozinho, com os desenhos e sons do aluno. Se ele trocar de computador, a lição abre como ele deixou.

## Como funciona cada bloco
O botão amarelo **Como funciona cada bloco** abre a explicação de cada bloco da lição, desenhado do mesmo jeito que aparece no editor.

![Ajuda dos blocos aberta](aluno-ajuda)

## O resultado
Depois de **Verificar**, aparece uma janela com as estrelas (1 a 3), dicas do que falta e o botão **Próxima lição** quando o desafio foi resolvido.

> Atenção: a verificação sempre começa com os atores no lugar inicial da lição. Por isso o aluno pode testar o programa várias vezes com a bandeira verde antes de verificar.

![Janela de resultado da verificação](aluno-resultado)

## Levar o projeto para o PictoBlox
No editor, **Arquivo → Baixar para o seu computador** salva o projeto como **.sb3**. Esse arquivo abre direto no PictoBlox e no Scratch.

## XP, níveis e medalhas
Cada lição concluída dá XP. O XP sobe o nível do aluno (de Aprendiz de Blocos até Lenda do Torneio), e as conquistas viram medalhas, como "Primeiro passo", "De primeira!" e "Pronto(a) para a Jam".

## Missões extras no PictoBlox
No fim de cada mundo há uma missão **opcional** para fazer no PictoBlox. O aluno salva o projeto (**Arquivo → Salvar no seu computador**), envia o arquivo **.sb3** na lição e a plataforma confere.

> Dica: as missões no PictoBlox nunca bloqueiam o caminho. Quem não tem o PictoBlox segue normalmente pelo site.
`,
  },
  {
    slug: "progresso",
    title: "Acompanhar a turma",
    body: `
Na página da turma, o **Progresso da turma** mostra um mapa: cada linha é um aluno e cada quadradinho é uma lição.

![Mapa de progresso da turma](prof-progresso)

## Como ler o mapa
- **Verde forte**: 3 estrelas. **Verde claro**: 2. **Amarelo**: 1.
- **·**: o aluno tentou e ainda não concluiu.
- **★** no topo: missão extra (PictoBlox).
- Troque de mundo pelos botões acima do mapa.

## Quem precisa de ajuda
Aparece um aviso com os nomes dos alunos que tentaram **3 vezes ou mais** sem concluir uma lição. Eles também ganham um **⚠** ao lado do nome. É um bom momento para sentar junto e olhar os blocos.
`,
  },
  {
    slug: "certificados",
    title: "Certificados",
    body: `
Quando o aluno conclui todas as lições obrigatórias de um mundo, a plataforma gera um **certificado em PDF** com a marca da escola.

- O aluno baixa pelo botão **Certificado** no card do mundo.
- Você baixa pelo mapa de progresso: clique no **🎓** ao lado do aluno.

> Dica: o certificado tem um código de conferência. Ele não mostra dados além do primeiro nome do aluno e da escola.
`,
  },
  {
    slug: "game-jam",
    title: "Game Jam",
    body: `
A Game Jam é uma competição em que as equipes criam um jogo sobre um tema, dentro de um prazo. O julgamento é **às cegas**: os jurados não sabem de qual escola vem cada jogo.

![Página de uma game jam com prêmios e cronômetro](jam-pagina)

## As fases
- **Inscrições abertas**: você já pode montar as equipes.
- **Em andamento**: as equipes entregam (e podem atualizar) até o fim do prazo. O cronômetro mostra quanto falta.
- **Em julgamento**: os jurados avaliam.
- **Encerrada**: saem o resultado, os prêmios e os comentários dos jurados para cada equipe.

## Inscrever uma equipe
1. Abra a jam e clique em **+ Inscrever nova equipe**.
2. Dê um nome à equipe (sem o nome da escola!).
3. Marque os alunos e escolha o **ano escolar** de cada um (2º ao 9º ano).
4. Todos precisam caber na **mesma categoria** (por exemplo, 4º e 5º ano). A plataforma avisa se os anos não combinarem.
5. Clique em **Inscrever equipe**.

![Inscrição de equipe com o ano escolar dos alunos](jam-equipe)

## A entrega
Você ou os alunos da equipe abrem a equipe e clicam em **Entregar**. A entrega tem quatro partes:
1. O **projeto** do jogo (arquivo .sb3 do PictoBlox ou do Scratch).
2. Uma **descrição breve** do jogo.
3. O **link do YouTube** com o jogo funcionando. Pode ser um vídeo "não listado".
4. A **documentação** com as etapas de desenvolvimento (PDF ou Word).

![Formulário de entrega da equipe](jam-entrega)

> Atenção: para o julgamento ser justo, não coloque o nome da escola, da cidade ou dos alunos no jogo, no vídeo, no nome do canal do YouTube nem na documentação. A plataforma apaga os dados de autor dos arquivos e avisa se encontrar algum nome.
`,
  },
  {
    slug: "perguntas",
    title: "Perguntas frequentes",
    body: `
## O aluno diz que o código não funciona
Confira se a turma não foi arquivada e se o aluno está digitando o código da turma certa. Letras maiúsculas ou minúsculas não fazem diferença.

## O aluno não vê nenhum mundo
O curso precisa estar liberado para a turma: página da turma → **Cursos da turma** → **Liberar curso**.

## Uma lição aparece trancada
As lições abrem em sequência. O aluno precisa concluir a lição obrigatória anterior.

## O editor de blocos fica em "Abrindo o editor…"
Na primeira vez, o editor é baixado para o computador (alguns segundos). Se não abrir, recarregue a página. Navegadores muito antigos podem não funcionar: use Chrome, Edge ou Firefox atualizados.

## O Verificar diz que um bloco "ainda não é verificado"
O aluno usou um bloco que não faz parte do curso (por exemplo, copiado de outro projeto). Peça para tirar esse bloco e verificar de novo.

## O envio do .sb3 foi recusado
O arquivo precisa terminar em **.sb3** e ter no máximo 25 MB. No PictoBlox, use **Arquivo → Salvar no seu computador**.

## Esqueci minha senha
Peça à coordenação da escola ou ao suporte da plataforma uma senha nova.
`,
  },
];
