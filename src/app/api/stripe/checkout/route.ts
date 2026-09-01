import { NextRequest, NextResponse } from "next/server";
import { hasSpecialAccess } from "@/lib/access-control";
import { createServerSupabaseReadClient, createSupabaseAdminClient } from "@/lib/server/supabase";
import { getStripe } from "@/lib/stripe";
import { subscriptionBlocksCheckout } from "@/lib/stripe-subscription";
import { getURL } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }

    const planKey = (body as { planKey?: unknown })?.planKey;
    if (planKey !== "monthly" && planKey !== "yearly") {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const subscriptionPath = `/dashboard/subscription?plan=${planKey}`;
    const supabase = await createServerSupabaseReadClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) {
      return NextResponse.json(
        {
          redirect: `/login?next=${encodeURIComponent(subscriptionPath)}&plan=${planKey}`,
          message: "Faça login para assinar um plano.",
        },
        { status: 401 },
      );
    }

    const priceId =
      planKey === "monthly"
        ? process.env.STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: "O preço deste plano não está configurado." },
        { status: 503 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 409 });
    }
    if (profile.role !== "student") {
      return NextResponse.json(
        { error: "Este tipo de perfil não pode contratar um plano de aluno." },
        { status: 403 },
      );
    }
    if (
      profile.subscription_status === "admin_granted" ||
      hasSpecialAccess(user.id, user.email)
    ) {
      return NextResponse.json(
        { error: "Esta conta já possui acesso Pro.", code: "already_entitled" },
        { status: 409 },
      );
    }

    const stripe = getStripe();
    let customerId = profile.stripe_customer_id as string | null;

    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10,
      });
      const existingSubscription = subscriptions.data.find((subscription) =>
        subscriptionBlocksCheckout(subscription.status),
      );

      if (existingSubscription) {
        return NextResponse.json(
          {
            error: "Já existe uma assinatura vinculada a esta conta. Gerencie-a no portal.",
            code: "subscription_exists",
          },
          { status: 409 },
        );
      }
    } else if (profile.subscription_status === "active") {
      return NextResponse.json(
        {
          error: "A conta está ativa, mas o cliente Stripe precisa ser conciliado antes de uma nova compra.",
          code: "billing_reconciliation_required",
        },
        { status: 409 },
      );
    } else {
      const customer = await stripe.customers.create(
        {
          email: user.email ?? undefined,
          metadata: { userId: user.id },
        },
        { idempotencyKey: `pianify-customer-${user.id}` },
      );
      customerId = customer.id;

      const supabaseAdmin = createSupabaseAdminClient();
      const { error: customerPersistenceError } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
        .is("stripe_customer_id", null);

      if (customerPersistenceError) throw customerPersistenceError;
    }

    const siteUrl = getURL();
    const checkoutBucket = Math.floor(Date.now() / (30 * 60 * 1000));
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl}/dashboard/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/dashboard/subscription?checkout=canceled&plan=${planKey}`,
        client_reference_id: user.id,
        customer: customerId,
        metadata: { planKey, userId: user.id },
        subscription_data: { metadata: { planKey, userId: user.id } },
      },
      {
        idempotencyKey: `pianify-checkout-${user.id}-${planKey}-${checkoutBucket}`,
      },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." },
      { status: 500 },
    );
  }
}
