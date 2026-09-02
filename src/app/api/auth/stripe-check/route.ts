import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { hasSpecialAccess, isActiveTrial } from "@/lib/access-control";
import {
  createServerSupabaseReadClient,
  createSupabaseAdminClient,
  getOptionalSupabaseUser,
} from "@/lib/server/supabase";
import { getStripe } from "@/lib/stripe";
import {
  pickRelevantSubscription,
  stripeSubscriptionHasPremium,
} from "@/lib/stripe-subscription";

interface StripeSubscriptionWithPeriod extends Stripe.Subscription {
  current_period_start: number;
  current_period_end: number;
}

export const dynamic = "force-dynamic";

const freeResponse = {
  status: "inactive",
  planType: "free",
  hasAccess: true,
  isPro: false,
  customerId: null,
  interval: null,
  currentPeriodEnd: null,
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseReadClient();
    const user = await getOptionalSupabaseUser(supabase);
    if (!user) {
      return NextResponse.json(
        { status: "unauthorized", hasAccess: false, isPro: false },
        { status: 401 },
      );
    }

    if (hasSpecialAccess(user.id, user.email)) {
      return NextResponse.json({
        status: "special_access",
        planType: "special_access",
        hasAccess: true,
        isPro: true,
        customerId: null,
        interval: "forever",
        currentPeriodEnd: null,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, stripe_customer_id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json(
        { status: "profile_missing", hasAccess: false, isPro: false },
        { status: 409 },
      );
    }

    if (profile.role === "teacher" || profile.role === "admin") {
      return NextResponse.json({
        status: "not_applicable",
        planType: "free",
        hasAccess: false,
        isPro: false,
        isTeacher: profile.role === "teacher",
        customerId: profile.stripe_customer_id ?? null,
        interval: null,
        currentPeriodEnd: null,
      });
    }

    if (profile.subscription_status === "admin_granted") {
      return NextResponse.json({
        status: "admin_granted",
        planType: "admin_granted",
        hasAccess: true,
        isPro: true,
        customerId: profile.stripe_customer_id ?? null,
        interval: "forever",
        currentPeriodEnd: null,
      });
    }

    if (isActiveTrial(profile)) {
      return NextResponse.json({
        status: "trialing",
        planType: "trial",
        hasAccess: true,
        isPro: true,
        customerId: profile.stripe_customer_id ?? null,
        interval: "trial",
        currentPeriodEnd: new Date(profile.trial_ends_at!).toISOString(),
      });
    }

    const customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      if (profile.subscription_status === "active") {
        return NextResponse.json(
          {
            status: "billing_reconciliation_required",
            planType: "free",
            hasAccess: true,
            isPro: false,
            customerId: null,
          },
          { status: 503 },
        );
      }
      return NextResponse.json(freeResponse);
    }

    const stripe = getStripe();
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    });
    const selected = pickRelevantSubscription(subscriptions.data) as
      | StripeSubscriptionWithPeriod
      | undefined;

    if (!selected) {
      return NextResponse.json({ ...freeResponse, customerId });
    }

    const interval = selected.items.data[0]?.price.recurring?.interval ?? null;
    const amount = selected.items.data[0]?.price.unit_amount;
    const currency = selected.items.data[0]?.price.currency ?? "brl";
    const premium = stripeSubscriptionHasPremium(selected.status);
    const trialEndsAt = selected.trial_end
      ? new Date(selected.trial_end * 1000).toISOString()
      : null;

    if (
      profile.subscription_status !== selected.status ||
      (selected.status === "trialing" && profile.trial_ends_at !== trialEndsAt)
    ) {
      const supabaseAdmin = createSupabaseAdminClient();
      const { error: reconciliationError } = await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: selected.status,
          subscription_plan_interval: interval,
          stripe_subscription_id: selected.id,
          trial_ends_at: selected.status === "trialing" ? trialEndsAt : null,
        })
        .eq("id", user.id)
        .eq("stripe_customer_id", customerId);

      if (reconciliationError) throw reconciliationError;
    }

    if (!premium) {
      return NextResponse.json({
        ...freeResponse,
        status: selected.status,
        planType: selected.status === "past_due" ? "past_due" : "free",
        customerId,
        interval,
      });
    }

    const invoicesData = await stripe.invoices.list({ customer: customerId, limit: 6 });
    const invoices = invoicesData.data.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status ?? "unknown",
      date: new Date(invoice.created * 1000).toISOString(),
      pdf_url: invoice.invoice_pdf,
    }));

    return NextResponse.json({
      status: selected.status,
      planType: selected.status === "trialing" ? "trial" : interval === "year" ? "yearly" : "monthly",
      hasAccess: true,
      isPro: true,
      customerId,
      interval,
      currentPeriodStart: new Date(selected.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(selected.current_period_end * 1000).toISOString(),
      subscriptionStart: new Date(selected.created * 1000).toISOString(),
      cancelAtPeriodEnd: selected.cancel_at_period_end,
      amount: amount ? amount / 100 : 0,
      currency,
      invoices,
    });
  } catch (error: unknown) {
    console.error("stripe-check error:", error);
    return NextResponse.json(
      {
        status: "service_unavailable",
        planType: "free",
        hasAccess: false,
        isPro: false,
        error: "Não foi possível verificar a assinatura agora.",
      },
      { status: 503 },
    );
  }
}
