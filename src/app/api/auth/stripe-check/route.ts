import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { hasSpecialAccess } from "@/lib/access-control";
import type Stripe from "stripe";

interface StripeSubscription extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    const email = user?.email;

    if (!userId) {
      return NextResponse.json(
        { status: "unauthorized", hasAccess: false },
        { status: 401 }
      );
    }

    if (hasSpecialAccess(userId, email)) {
      return NextResponse.json({
        status: "special_access",
        planType: "admin_granted",
        hasAccess: true,
        isPro: true,
        customerId: "admin_vip",
        interval: "forever",
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, stripe_customer_id, role")
      .eq("id", userId)
      .single();

    // 1. Verificação Especial para Professor Parceiro
    if (profile?.role === "teacher") {
      return NextResponse.json({
        status: "active",
        planType: "teacher_partner",
        hasAccess: false, // Professor não tem acesso à biblioteca PRO de aluno
        isPro: false,
        isTeacher: true,
        customerId: profile.stripe_customer_id || null,
        interval: "lifetime",
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      });
    }

    if (profile) {
      const now = new Date();
      if (profile.subscription_status === "active") {
        // Mantemos prosseguindo para buscar dados reais do Stripe se houver customerId
      } else {
        const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
        if (profile.subscription_status === "trialing" && trialEndsAt && now < trialEndsAt) {
          await supabase
            .from("profiles")
            .update({
              subscription_status: "trialing",
              trial_ends_at: trialEndsAt.toISOString(),
            })
            .eq("id", userId);

          return NextResponse.json({
            status: "trialing",
            planType: "trial",
            hasAccess: true,
            isPro: false,
            customerId: profile.stripe_customer_id || null,
            currentPeriodEnd: trialEndsAt.toISOString(),
          });
        }
      }
    }

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const sessions = await stripe.checkout.sessions.list({ limit: 100 });
      for (const session of sessions.data) {
        if (
          session.client_reference_id === userId ||
          session.metadata?.userId === userId
        ) {
          if (session.customer) {
            customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
          }
          break;
        }
      }

      if (customerId) {
        await supabase
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", userId);
      }
    }

    if (!customerId) {
      return NextResponse.json({ status: "inactive", planType: "free", hasAccess: false, isPro: false });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      const otherSubs = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1,
      });
      const latestSub = otherSubs.data[0];
      if (latestSub && (latestSub.status === "trialing" || latestSub.status === "past_due")) {
        await supabase
          .from("profiles")
          .update({
            subscription_status: latestSub.status,
            trial_ends_at:
              latestSub.status === "trialing" && latestSub.trial_end
                ? new Date(latestSub.trial_end * 1000).toISOString()
                : null,
          })
          .eq("id", userId);

        return NextResponse.json({
          status: latestSub.status,
          planType: latestSub.status === "trialing" ? "trial" : "past_due",
          hasAccess: latestSub.status === "trialing",
          customerId,
        });
      }
      return NextResponse.json({ status: "inactive", planType: "free", hasAccess: false, isPro: false });
    }

    const activeSub = subscriptions.data[0] as StripeSubscription;
    const interval = activeSub.items.data[0]?.plan?.interval;
    const amount = activeSub.items.data[0]?.plan?.amount;
    const currency = activeSub.items.data[0]?.plan?.currency;

    // Buscar faturas recentes
    const invoicesData = await stripe.invoices.list({
      customer: customerId,
      limit: 6,
    });

    const invoices = invoicesData.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      date: new Date(inv.created * 1000).toISOString(),
      pdf_url: inv.invoice_pdf,
    }));

    await supabase
      .from("profiles")
      .update({
        subscription_status: "active",
        trial_ends_at:
          activeSub.status === "trialing" && activeSub.trial_end
            ? new Date(activeSub.trial_end * 1000).toISOString()
            : null,
      })
      .eq("id", userId);

    return NextResponse.json({
      status: activeSub.status,
      planType: interval === "year" ? "yearly" : "monthly",
      hasAccess: true,
      isPro: true,
      customerId,
      interval: interval || null,
      currentPeriodStart: new Date(activeSub.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(activeSub.current_period_end * 1000).toISOString(),
      subscriptionStart: new Date(activeSub.created * 1000).toISOString(),
      cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      amount: amount ? amount / 100 : 0,
      currency: currency || "brl",
      invoices,
    });
  } catch (err: unknown) {
    console.error("stripe-check error:", err);
    return NextResponse.json({ status: "error", planType: "free", hasAccess: false });
  }
}
