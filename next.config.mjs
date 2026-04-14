import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
    outputFileTracingRoot: __dirname,
    // PermissÃµes de imagens
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
            {
                protocol: 'https',
                hostname: 'upload.wikimedia.org',
            },
        ],
    },
    // Headers de seguranÃ§a (boa prÃ¡tica para produÃ§Ã£o)
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
                // Webhook do Stripe nÃ£o deve ter cache
                source: "/api/stripe/webhook",
                headers: [
                    { key: "Cache-Control", value: "no-store" },
                ],
            },
        ];
    },

    // Redireciona /dashboard para login se nÃ£o autenticado
    async redirects() {
        return [];
    },
};

export default nextConfig;
