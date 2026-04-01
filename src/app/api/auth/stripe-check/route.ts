import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ 
      status: "unauthorized",
      hasAccess: false 
    }, { status: 401 });
  }

  // Por enquanto, simulamos o acesso se o usuário estiver logado
  // Em produção, isso deve checar o banco de dados ou metadados do Clerk
  const isSubscribed = true; 

  const userData = {
    status: isSubscribed ? "active" : "inactive",
    planType: isSubscribed ? "piano-kids-pro" : "free",
    hasAccess: isSubscribed,
  };

  // Simula um delay de rede para a requisição
  await new Promise((resolve) => setTimeout(resolve, 800));

  return NextResponse.json(userData);
}
