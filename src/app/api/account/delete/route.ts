import { NextResponse } from "next/server";
import {
  createServerSupabaseReadClient,
  createSupabaseAdminClient,
  getOptionalSupabaseUser,
} from "@/lib/server/supabase";
import { getStripe } from "@/lib/stripe";
import {
  deletionModeFor,
  isDeletionConfirmed,
  isOwnAvatarFile,
  isSameOriginRequest,
  subscriptionNeedsCancel,
} from "@/lib/accountDeletion";

export const dynamic = "force-dynamic";

/** Cancels every subscription of the customer that could still charge. */
async function cancelBillableSubscriptions(customerId: string) {
  const stripe = getStripe();
  let cancelled = 0;
  for await (const subscription of stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 })) {
    if (!subscriptionNeedsCancel(subscription.status)) continue;
    await stripe.subscriptions.cancel(subscription.id);
    cancelled += 1;
  }
  return cancelled;
}

async function removeAvatarFiles(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string) {
  const { data, error } = await admin.storage.from("avatars").list("", { search: userId, limit: 100 });
  if (error) throw error;
  const files = (data ?? []).map((file) => file.name).filter((name) => isOwnAvatarFile(name, userId));
  if (files.length) {
    const { error: removeError } = await admin.storage.from("avatars").remove(files);
    if (removeError) throw removeError;
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request.headers.get("origin"), request.headers.get("host"))) {
    return NextResponse.json({ error: "Origem da solicitação não permitida." }, { status: 403 });
  }

  let body: { confirm?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // Handled by the confirmation check below.
  }
  if (!isDeletionConfirmed(body.confirm)) {
    return NextResponse.json({ error: "Digite EXCLUIR para confirmar." }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabaseReadClient();
    const user = await getOptionalSupabaseUser(supabase);
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role, stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const mode = deletionModeFor(profile?.role);

    if (mode === "blocked") {
      return NextResponse.json(
        { error: "Contas de administrador não podem ser excluídas pelo app." },
        { status: 403 },
      );
    }

    if (mode === "request") {
      const { data: open, error: openError } = await admin
        .from("account_deletion_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "requested")
        .maybeSingle();
      if (openError) throw openError;
      if (!open) {
        const { error } = await admin.from("account_deletion_requests").insert({
          user_id: user.id,
          role: profile?.role ?? "teacher",
          status: "requested",
          contact_email: user.email ?? null,
        });
        // 23505: a request raced in between; the partial unique index keeps one open.
        if (error && error.code !== "23505") throw error;
      }
      return NextResponse.json({ status: "requested" });
    }

    // Student: stop billing first; if Stripe fails, keep the account so nothing is charged
    // to someone who can no longer log in to cancel.
    let hadSubscription = false;
    if (profile?.stripe_customer_id) {
      try {
        hadSubscription = (await cancelBillableSubscriptions(profile.stripe_customer_id)) > 0;
      } catch (error) {
        console.error("Account deletion: Stripe cancellation failed", error);
        return NextResponse.json(
          { error: "Não conseguimos cancelar sua assinatura agora. Nada foi excluído; tente de novo em alguns minutos." },
          { status: 502 },
        );
      }
    }

    try {
      await removeAvatarFiles(admin, user.id);
    } catch (error) {
      // A leftover avatar must not block the deletion; it is logged for manual cleanup.
      console.error("Account deletion: avatar cleanup failed", error);
    }

    // Deleting the auth user cascades to the profile, practice history and the rest.
    // Invoices stay (fiscal obligation) with the user link cleared.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;

    const { error: logError } = await admin.from("account_deletion_requests").insert({
      user_id: user.id,
      role: profile?.role ?? "student",
      status: "completed",
      had_subscription: hadSubscription,
      completed_at: new Date().toISOString(),
    });
    if (logError) console.error("Account deletion: log insert failed", logError);

    return NextResponse.json({ status: "deleted" });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Não foi possível excluir a conta agora. Tente de novo ou fale com o suporte." },
      { status: 500 },
    );
  }
}
