import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select(`
         *,
         profiles:teacher_id(full_name, username, pix_key, balance_withdrawn_total)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ withdrawals });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { withdrawal_id, status, receipt_url, teacher_id, amount } = await request.json();
    const normalizedAmount = Number(amount);
    const allowedStatuses = new Set(["pendente", "aprovado", "concluido", "rejeitado"]);

    if (
      !withdrawal_id ||
      !teacher_id ||
      !allowedStatuses.has(status) ||
      !Number.isFinite(normalizedAmount) ||
      normalizedAmount < 0
    ) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (adminProfile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error: updErr } = await supabase
      .from("withdrawals")
      .update({ status, receipt_url, updated_at: new Date().toISOString() })
      .eq("id", withdrawal_id);

    if (updErr) throw updErr;

    if (status === "concluido" || status === "aprovado") {
      const { data: profBase } = await supabase
        .from("profiles")
        .select("balance_withdrawn_total")
        .eq("id", teacher_id)
        .single();
      const currentSum = Number(profBase?.balance_withdrawn_total || 0);

      await supabase
        .from("profiles")
        .update({ balance_withdrawn_total: currentSum + normalizedAmount })
        .eq("id", teacher_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
