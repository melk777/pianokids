/**
 * Módulo de Controle de Acesso (Whitelist) - Pianify 2026
 * 
 * Adicione aqui os IDs ou E-mails de usuários que devem ter acesso premium TOTAL
 * sem precisar de assinatura ativa no Stripe.
 * 
 * Como encontrar o ID do Supabase? 
 * No Dashboard do Supabase > Authentication > Users (ex: a1b2c3d4...)
 */

export const SPECIAL_ACCESS_IDS: string[] = [
  "alessia_samanta@hotmail.com", // Acesso via E-mail
  "comerciomelk@gmail.com",       // Acesso via E-mail
  // "a1b2c3d4...", // Adicione IDs do Supabase aqui
];

/**
 * Função utilitária para verificar se um usuário é VIP.
 * Aceita tanto o UserID do Supabase quanto o e-mail.
 */
export function hasSpecialAccess(userId: string | null | undefined, email?: string | null): boolean {
  const normalizedList = SPECIAL_ACCESS_IDS.map(id => id.toLowerCase().trim());
  
  if (userId && normalizedList.includes(userId.toLowerCase().trim())) return true;
  if (email && normalizedList.includes(email.toLowerCase().trim())) return true;
  
  return false;
}
