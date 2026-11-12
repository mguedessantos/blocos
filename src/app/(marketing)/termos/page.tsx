// RASCUNHO: revisar com um advogado antes de vender (contratos, LGPD, CDC).
export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <article className="prose max-w-none space-y-4 py-6">
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Versão preliminar (termos-v1).</p>
      <h1 className="text-3xl font-extrabold">Termos de Uso</h1>
      <h2 className="text-xl font-bold">1. O serviço</h2>
      <p>A plataforma oferece trilhas de ensino de programação em blocos, ferramentas de acompanhamento para professores e organização de game jams, contratada por escolas e professores (os “Clientes”).</p>
      <h2 className="text-xl font-bold">2. Contas</h2>
      <p>O Cliente é responsável pelas contas de professores e alunos que criar, pela guarda das senhas e pelo uso adequado da plataforma por seus usuários.</p>
      <h2 className="text-xl font-bold">3. Planos, teste e pagamento</h2>
      <p>O teste grátis dura 14 dias. Após o teste ou em caso de falta de pagamento, a conta passa a modo somente leitura. Assinaturas são renovadas automaticamente e podem ser canceladas a qualquer momento, valendo até o fim do período pago.</p>
      <h2 className="text-xl font-bold">4. Dados dos alunos</h2>
      <p>O tratamento de dados pessoais segue a Política de Privacidade e o Acordo de Tratamento de Dados: o Cliente é o controlador dos dados dos alunos e a plataforma atua como operadora.</p>
      <h2 className="text-xl font-bold">5. Conteúdo</h2>
      <p>Projetos criados pelos alunos pertencem a seus autores. O Cliente autoriza a plataforma a armazená-los e exibi-los dentro do serviço (por exemplo, em game jams).</p>
    </article>
  );
}
