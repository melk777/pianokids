import { NextResponse } from "next/server";

export async function GET() {
  // Mock de um usuário autenticado (Substitua por getServerSession ou auth() do NextAuth/Clerk)
  // Simulamos uma chamada ao seu banco de dados ou diretamente ao Stripe via Customer ID
  
  // Altere para true para testar a experiência "Premium" e false para "Free"
  const isSubscribed = false; 

  const userData = {
    // Retornamos o status da assinatura
    status: isSubscribed ? "active" : "inactive",
    planType: isSubscribed ? "piano-kids-pro" : "free",
    hasAccess: isSubscribed,
  };

  // Simula um delay de rede para a requisição
  await new Promise((resolve) => setTimeout(resolve, 800));

  return NextResponse.json(userData);
}
