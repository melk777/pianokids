/** @type {import('next').NextConfig} */
const nextConfig = {
    // Permite que o Stripe SDK seja importado no server sem warnings de peer deps
    serverExternalPackages: ["stripe"],

    // Headers de segurança (boa prática para produção)
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                ],
            },
            {
                // Webhook do Stripe não deve ter cache
                source: "/api/stripe/webhook",
                headers: [
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
        ];
    },

    // Redireciona /dashboard para login se não autenticado (Clerk faz isso no middleware,
    // mas deixar aqui como fallback é boa prática)
    async redirects() {
        return [];
    },
};

export default nextConfig;
