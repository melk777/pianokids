import { NextResponse } from "next/server";
import {
  createServerSupabaseReadClient,
  createSupabaseAdminClient,
  getOptionalSupabaseUser,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseReadClient();
    const user = await getOptionalSupabaseUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: teacherProfile, error: teacherError } = await supabaseAdmin
      .from("profiles")
      .select("role, referral_code")
      .eq("id", user.id)
      .maybeSingle();
    if (teacherError) throw teacherError;
    if (teacherProfile?.role !== "teacher") {
      return NextResponse.json({ error: "Acesso exclusivo para professores." }, { status: 403 });
    }

    const [{ data: students, error: studentsError }, { data: entries, error: entriesError }] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, username, subscription_status, subscription_plan_interval, created_at, songs_completed, trophies, last_practice_date")
          .eq("referred_by", user.id)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("teacher_commission_entries")
          .select("amount, available_at, withdrawal_id, settled_at")
          .eq("teacher_id", user.id),
      ]);

    if (studentsError) throw studentsError;
    if (entriesError) throw entriesError;

    const now = Date.now();
    let balanceAvailable = 0;
    let balancePending = 0;
    let unsettledBalance = 0;
    let estimatedEarnings = 0;

    for (const entry of entries ?? []) {
      const amount = Number(entry.amount || 0);
      estimatedEarnings += amount;
      if (entry.withdrawal_id || entry.settled_at) continue;

      unsettledBalance += amount;

      if (new Date(entry.available_at).getTime() <= now) {
        balanceAvailable += amount;
      }
    }

    balanceAvailable = Math.max(0, balanceAvailable);
    balancePending = Math.max(0, unsettledBalance - balanceAvailable);

    const formattedStudents = (students ?? []).map((student) => ({
      id: student.id,
      name: student.full_name || "Sem nome",
      username: student.username || "Sem usuário",
      status:
        student.subscription_status === "active"
          ? "Ativo"
          : student.subscription_status === "trialing"
            ? "Em teste"
            : "Inativo",
      plan_interval:
        student.subscription_plan_interval === "year" ? "Anual" : "Mensal",
      songs_completed: student.songs_completed || 0,
      trophies: student.trophies || 0,
      last_practice: student.last_practice_date || "Nunca praticou",
      created_at: student.created_at,
    }));

    return NextResponse.json({
      referral_code: teacherProfile.referral_code,
      activeStudents: (students ?? []).filter(
        (student) => student.subscription_status === "active",
      ).length,
      balance_available: Number(balanceAvailable.toFixed(2)),
      balance_pending: Number(balancePending.toFixed(2)),
      estimatedEarnings: Number(estimatedEarnings.toFixed(2)),
      students: formattedStudents,
    });
  } catch (error: unknown) {
    console.error("Teacher stats route error:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os dados do professor." },
      { status: 500 },
    );
  }
}
