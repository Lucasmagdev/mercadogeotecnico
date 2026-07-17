import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Mercado Geotécnico" },
      {
        name: "description",
        content: "Termos e condições de uso da plataforma Mercado Geotécnico.",
      },
    ],
  }),
  component: Termos,
});

const sections = [
  {
    title: "1. Sobre a plataforma",
    body: "O Mercado Geotécnico é um marketplace que conecta empresas do setor de engenharia para compra, venda e locação de equipamentos, além da contratação de serviços. A plataforma atua como intermediadora de contato: as negociações, pagamentos e entregas são de responsabilidade das partes envolvidas.",
  },
  {
    title: "2. Cadastro e conta",
    body: "Para anunciar ou entrar em contato com anunciantes é necessário criar uma conta com informações verdadeiras e atualizadas. Contas de empresas passam por análise para receber o selo de verificação. Você é responsável por manter a confidencialidade das suas credenciais de acesso.",
  },
  {
    title: "3. Anúncios",
    body: "O anunciante é integralmente responsável pela veracidade das informações publicadas, incluindo fotos, especificações técnicas, preço e condição do equipamento. Anúncios com conteúdo falso, ilegal ou enganoso serão removidos e podem resultar em suspensão da conta.",
  },
  {
    title: "4. Negociações",
    body: "A plataforma não participa das negociações nem garante a conclusão de transações. Recomendamos verificar o equipamento pessoalmente, conferir a documentação e nunca realizar pagamentos antecipados fora de canais seguros.",
  },
  {
    title: "5. Responsabilidades",
    body: "O Mercado Geotécnico não se responsabiliza por danos decorrentes de negociações realizadas entre usuários, incluindo vícios do produto, atrasos, fraudes ou descumprimento contratual entre as partes.",
  },
  {
    title: "6. Propriedade intelectual",
    body: "A marca, o layout e o conteúdo da plataforma são protegidos por direitos de propriedade intelectual. É proibida a reprodução sem autorização prévia.",
  },
  {
    title: "7. Alterações destes termos",
    body: "Estes termos podem ser atualizados a qualquer momento. Alterações relevantes serão comunicadas na plataforma. O uso continuado após as alterações implica concordância com a nova versão.",
  },
];

function Termos() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: julho de 2026</p>
      <div className="mt-8 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
