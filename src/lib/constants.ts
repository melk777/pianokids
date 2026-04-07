// ATENÇÃO: Price IDs são usados APENAS no server (api/stripe/checkout/route.ts)
// Nunca precisam de NEXT_PUBLIC_ porque nunca chegam ao browser
// Este arquivo só é importado em Server Actions / API Routes
export const PLANS = {
  monthly: {
    name: "Mensal",
    // process.env aqui só funciona no server — está correto
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
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
    priceId: process.env.STRIPE_YEARLY_PRICE_ID ?? "",
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
