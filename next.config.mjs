/** @type {import('next').NextConfig} */
const nextConfig = {
    // Permissões de imagens
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'wlqyvygbxzkuufeaixmi.supabase.co',
            },
        ],
    },
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

    // Redireciona /dashboard para login se não autenticado
    async redirects() {
        return [];
    },
};

export default nextConfig;
