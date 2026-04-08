/**
 * Utilitário para obter a URL base do site de forma dinâmica.
 * Útil para redirecionamentos de autenticação (Auth.js / Supabase).
 */
export const getURL = () => {
  let url =
    process.env?.NEXT_PUBLIC_SITE_URL ?? // Definida manualmente na Vercel (Produção)
    process.env?.NEXT_PUBLIC_VERCEL_URL ?? // Gerada automaticamente pela Vercel em Preview
    'http://localhost:3000/';

  // Garante o uso de https em ambientes Vercel ou produção
  url = url.includes('http') ? url : `https://${url}`;

  // Garante que a URL NÃO termina com barra
  url = url.endsWith('/') ? url.slice(0, -1) : url;

  return url;
};
