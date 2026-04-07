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
  // "user_2m...", // Adicione seus IDs aqui
];

/**
 * Função utilitária para verificar se um usuário é VIP.
 */
export function hasSpecialAccess(userId: string | null | undefined): boolean {
  if (!userId) return false;
  return SPECIAL_ACCESS_IDS.includes(userId);
}
