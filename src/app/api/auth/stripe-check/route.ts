import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { hasSpecialAccess } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
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
        customerId: "admin_vip",
        interval: "forever",
        currentPeriodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at, stripe_customer_id")
      .eq("id", userId)
      .single();

    if (profile) {
      const now = new Date();
      if (profile.subscription_status === "active") {
        return NextResponse.json({
          status: "active",
          planType: "paid",
          hasAccess: true,
          customerId: profile.stripe_customer_id || null,
        });
      }

      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      if (profile.subscription_status === "trialing" && trialEndsAt && now < trialEndsAt) {
        return NextResponse.json({
          status: "trialing",
          planType: "trial",
          hasAccess: true,
          customerId: profile.stripe_customer_id || null,
          currentPeriodEnd: trialEndsAt.toISOString(),
        });
      }
    }

    const stripe = getStripe();
    const sessions = await stripe.checkout.sessions.list({ limit: 100 });
    let customerId: string | undefined;

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

    if (!customerId) {
      return NextResponse.json({ status: "inactive", planType: "free", hasAccess: false });
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
        return NextResponse.json({
          status: latestSub.status,
          planType: latestSub.status === "trialing" ? "trial" : "past_due",
          hasAccess: latestSub.status === "trialing",
          customerId,
        });
      }
      return NextResponse.json({ status: "inactive", planType: "free", hasAccess: false });
    }

    const activeSub = subscriptions.data[0];
    const interval = activeSub.items.data[0]?.plan?.interval;

    return NextResponse.json({
      status: "active",
      planType: interval === "year" ? "yearly" : "monthly",
      hasAccess: true,
      customerId,
      interval: interval || null,
    });
  } catch (err: unknown) {
    console.error("stripe-check error:", err);
    return NextResponse.json({ status: "error", planType: "free", hasAccess: false });
  }
}
