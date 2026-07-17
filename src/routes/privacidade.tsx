import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Mercado Geotécnico" },
      {
        name: "description",
        content:
          "Como o Mercado Geotécnico coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.",
      },
    ],
  }),
  component: Privacidade,
});

const sections = [
  {
    title: "1. Dados que coletamos",
    body: "Coletamos os dados fornecidos no cadastro (nome, e-mail, telefone, CNPJ e dados da empresa), dados de uso da plataforma (páginas acessadas, buscas e interações) e dados técnicos (endereço IP, tipo de dispositivo e navegador).",
  },
  {
    title: "2. Como usamos seus dados",
    body: "Usamos os dados para operar o marketplace (exibir anúncios, conectar compradores e vendedores, enviar notificações de mensagens e propostas), melhorar a experiência de uso, prevenir fraudes e cumprir obrigações legais.",
  },
  {
    title: "3. Compartilhamento",
    body: "Dados de contato de anunciantes são exibidos a usuários autenticados quando solicitado. Não vendemos dados pessoais a terceiros. Podemos compartilhar dados com provedores de infraestrutura (hospedagem, autenticação e análise) estritamente para operação do serviço.",
  },
  {
    title: "4. Cookies",
    body: "Usamos cookies essenciais para autenticação e preferências (como tema claro/escuro) e, mediante consentimento, cookies de análise para entender o uso da plataforma. Você pode gerenciar o consentimento no banner de cookies.",
  },
  {
    title: "5. Seus direitos (LGPD)",
    body: "Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, além de revogar consentimentos. Para exercer seus direitos, entre em contato pelo e-mail de suporte.",
  },
  {
    title: "6. Segurança e retenção",
    body: "Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito e controle de acesso. Os dados são mantidos enquanto sua conta estiver ativa ou conforme exigido por lei.",
  },
  {
    title: "7. Contato",
    body: "Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser enviadas ao nosso encarregado de dados (DPO) pelo canal de suporte da plataforma.",
  },
];

function Privacidade() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">Política de Privacidade</h1>
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
