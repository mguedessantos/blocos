// RASCUNHO — revisar com um advogado/DPO antes de vender (LGPD, dados de crianças).
export const metadata = { title: "Política de Privacidade" };

export default function PrivacidadePage() {
  return (
    <article className="max-w-none space-y-4 py-6">
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Versão preliminar (privacidade-v1 / dpa-v1).</p>
      <h1 className="text-3xl font-extrabold">Política de Privacidade</h1>
      <h2 className="text-xl font-bold">Papéis (LGPD)</h2>
      <p>A escola ou professor contratante é o <strong>controlador</strong> dos dados dos alunos. A plataforma é a <strong>operadora</strong> e trata os dados apenas para prestar o serviço.</p>
      <h2 className="text-xl font-bold">Dados das crianças</h2>
      <p>Coletamos o mínimo: primeiro nome ou apelido, nome de usuário, senha (criptografada), turma, progresso e projetos. Alunos não informam email, telefone, foto ou data de nascimento.</p>
      <h2 className="text-xl font-bold">Inteligência artificial</h2>
      <p>Quando o tutor com IA está ativo, enviamos ao provedor apenas a atividade e os blocos do projeto — nunca o nome ou identificação do aluno.</p>
      <h2 className="text-xl font-bold">Direitos e exclusão</h2>
      <p>O controlador pode exportar ou excluir os dados de qualquer aluno pelo painel. Após o cancelamento, os dados são mantidos por 90 dias e depois apagados.</p>
      <h2 className="text-xl font-bold">Pagamentos</h2>
      <p>Pagamentos são processados pelo Stripe. Não armazenamos dados de cartão.</p>
    </article>
  );
}
