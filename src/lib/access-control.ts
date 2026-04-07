/**
 * Módulo de Controle de Acesso (Whitelist)
 * 
 * Adicione aqui os IDs dos usuários do Clerk que devem ter acesso premium TOTAL
 * sem precisar assinar via Stripe.
 * 
 * Como encontrar o ID? 
 * No Clerk Dashboard do seu projeto, você verá o UserID (ex: user_2m...)
 */

export const SPECIAL_ACCESS_IDS: string[] = [
  "alessia_samanta@hotmail.com", // Acesso via E-mail
  // "user_2m...", // Adicione seus IDs aqui
];

/**
 * Função utilitária para verificar se um usuário é VIP.
 * Aceita tanto o UserID do Clerk quanto o e-mail.
 */
export function hasSpecialAccess(userId: string | null | undefined, email?: string | null): boolean {
  if (userId && SPECIAL_ACCESS_IDS.includes(userId)) return true;
  if (email && SPECIAL_ACCESS_IDS.includes(email)) return true;
  return false;
}
