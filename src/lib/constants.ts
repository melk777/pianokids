export const PLANS = {
  monthly: {
    name: "Mensal",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
    price: "R$ 29,90",
    period: "/mês",
    features: [
      "Acesso a todas as músicas",
      "Prática livre ilimitada",
      "Conexão MIDI",
      "Progresso salvo",
    ],
  },
  yearly: {
    name: "Anual",
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || "",
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
