import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/stripe";
import { hasSpecialAccess } from "@/lib/access-control";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/stripe-check
 * Verifica se o usuário logado possui uma assinatura ativa no Stripe.
 * Retorna: status, planType, hasAccess, customerId, interval (monthly/yearly)
 */
export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (!userId) {
    return NextResponse.json(
      { status: "unauthorized", hasAccess: false },
      { status: 401 }
    );
  }

  // 0. Verificação de ACESSO ESPECIAL (Whitelist)
  //    Se o usuário ou seu e-mail estiver na lista privilegiada, ignora o Stripe.
  if (hasSpecialAccess(userId, email)) {
    return NextResponse.json({
      status: "special_access",
      planType: "admin_granted",
      hasAccess: true,
      customerId: "admin_vip",
      interval: "forever",
      currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    });
  }

  try {
    const stripe = getStripe();

    // 1. Buscar o customerId do Stripe pelo userId do Clerk
    //    Procuramos nas sessions de checkout recentes
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });

    let customerId: string | undefined;

    for (const session of sessions.data) {
      if (
        session.client_reference_id === userId ||
        session.metadata?.clerkUserId === userId
      ) {
        if (session.customer) {
          customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer.id;
        }
        break;
      }
    }

    // 2. Se não encontrou customer, o usuário nunca assinou
    if (!customerId) {
      return NextResponse.json({
        status: "inactive",
        planType: "free",
        hasAccess: false,
        customerId: null,
        interval: null,
        currentPeriodEnd: null,
      });
    }

    // 3. Buscar assinaturas ativas do customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Verificar se existe uma assinatura "past_due" ou "trialing"
      const otherSubs = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });

      const latestSub = otherSubs.data[0];

      if (latestSub && (latestSub.status === "trialing" || latestSub.status === "past_due")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd = (latestSub as any).current_period_end;
        return NextResponse.json({
          status: latestSub.status,
          planType: latestSub.status === "trialing" ? "trial" : "past_due",
          hasAccess: latestSub.status === "trialing",
          customerId,
          interval: latestSub.items.data[0]?.plan?.interval || null,
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
        });
      }

      return NextResponse.json({
        status: "inactive",
        planType: "free",
        hasAccess: false,
        customerId,
        interval: null,
        currentPeriodEnd: null,
      });
    }

    // 4. Assinatura ativa encontrada
    const activeSub = subscriptions.data[0];
    const interval = activeSub.items.data[0]?.plan?.interval; // "month" or "year"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activePeriodEnd = (activeSub as any).current_period_end;

    return NextResponse.json({
      status: "active",
      planType: interval === "year" ? "yearly" : "monthly",
      hasAccess: true,
      customerId,
      interval: interval || null,
      currentPeriodEnd: activePeriodEnd
        ? new Date(activePeriodEnd * 1000).toISOString()
        : null,
    });
  } catch (err: unknown) {
    console.error("stripe-check error:", err);

    // Fallback: se o Stripe falhar (ex: chave inválida), retorna sem acesso
    return NextResponse.json({
      status: "error",
      planType: "free",
      hasAccess: false,
      customerId: null,
      interval: null,
      currentPeriodEnd: null,
    });
  }
}
