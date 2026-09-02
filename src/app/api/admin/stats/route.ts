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
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { data: viewer, error: viewerError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (viewerError) throw viewerError;
    if (viewer?.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const [profilesResult, withdrawalsResult, commissionsResult] = await Promise.all([
      admin
        .from("profiles")
        .select("id, role, subscription_status, subscription_plan_interval"),
      admin.from("withdrawals").select("amount, status"),
      admin
        .from("teacher_commission_entries")
        .select("amount, available_at, settled_at"),
    ]);
    if (profilesResult.error) throw profilesResult.error;
    if (withdrawalsResult.error) throw withdrawalsResult.error;
    if (commissionsResult.error) throw commissionsResult.error;

    const profiles = profilesResult.data ?? [];
    const withdrawals = withdrawalsResult.data ?? [];
    const commissions = commissionsResult.data ?? [];
    const students = profiles.filter((profile) => profile.role === "student");
    const teachers = profiles.filter((profile) => profile.role === "teacher");
    const activeStudents = students.filter(
      (profile) => profile.subscription_status === "active",
    );

    const now = Date.now();
    const debtGlobal = commissions
      .filter((entry) => !entry.settled_at)
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const debtMature = commissions
      .filter(
        (entry) =>
          !entry.settled_at && new Date(entry.available_at).getTime() <= now,
      )
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

    return NextResponse.json({
      totalStudents: students.length,
      totalActiveMonthly: activeStudents.filter(
        (profile) => profile.subscription_plan_interval !== "year",
      ).length,
      totalActiveYearly: activeStudents.filter(
        (profile) => profile.subscription_plan_interval === "year",
      ).length,
      totalTeachers: teachers.length,
      totalPendingValue: withdrawals
        .filter((withdrawal) => withdrawal.status === "pendente")
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0),
      totalPaidValue: withdrawals
        .filter((withdrawal) =>
          ["aprovado", "concluido"].includes(withdrawal.status),
        )
        .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0),
      debtMature: Math.max(0, Number(debtMature.toFixed(2))),
      debtGlobal: Math.max(0, Number(debtGlobal.toFixed(2))),
    });
  } catch (error: unknown) {
    console.error("Admin stats route error:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as métricas administrativas." },
      { status: 500 },
    );
  }
}
