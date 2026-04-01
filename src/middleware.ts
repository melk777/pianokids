import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define a rota /dashboard (e filhas) como protegidas
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // Redireciona usuários não logados automaticamente para o /login
  }
});

export const config = {
  matcher: [
    // Pula arquivos de imagem, CSS, NextJS assets, para eles não sofrerem latência pelo middleware
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Sempre roda em rotas de api ou trpc
    "/(api|trpc)(.*)",
  ],
};
