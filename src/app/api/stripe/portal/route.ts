import { NextResponse } from "next/server";
import { createServerSupabaseReadClient, getOptionalSupabaseUser } from "@/lib/server/supabase";
import { getStripe } from "@/lib/stripe";
import { getURL } from "@/lib/utils/url";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createServerSupabaseReadClient();
    const user = await getOptionalSupabaseUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nenhuma assinatura foi encontrada para esta conta." },
        { status: 404 },
      );
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getURL()}/dashboard/subscription`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Não foi possível abrir o portal da assinatura." },
      { status: 500 },
    );
  }
}
