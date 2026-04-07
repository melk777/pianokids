// ATENÇÃO: Os Price IDs agora são lidos dinamicamente na API de Checkout
// para garantir segurança e que as variáveis de ambiente sejam carregadas.
export const PLANS = {
  monthly: {
    name: "Mensal",
    price: "R$ 29,90",
    period: "/mês",
    features: [
      "Acesso a todas as músicas",
      "Prática livre ilimitada",
      "Reconhecimento via Microfone",
      "Progresso salvo",
    ],
  },
  yearly: {
    name: "Anual",
    price: "R$ 239,90",
    period: "/ano",
    features: [
      "Tudo do plano mensal",
      "2 meses grátis",
      "Músicas exclusivas",
      "Suporte prioritário",
    ],
    badge: "Mais popular",
  },
} as const;
