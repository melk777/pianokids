/**
 * Utilitário para obter a URL base do site de forma dinâmica.
 * Útil para redirecionamentos de autenticação (Auth.js / Supabase).
 */
export const getURL = () => {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000';

  // Garante o uso de https em ambientes Vercel ou produção (se não tiver protocolo)
  let normalizedUrl = url.includes('http') ? url : `https://${url}`;

  // Garante que a URL NÃO termina com barra
  normalizedUrl = normalizedUrl.endsWith('/') ? normalizedUrl.slice(0, -1) : normalizedUrl;

  return normalizedUrl;
};
