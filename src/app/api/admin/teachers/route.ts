import { NextResponse } from "next/server";
import { createServerSupabaseReadClient, createSupabaseAdminClient } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseReadClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
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
    const [teachersResult, studentsResult, commissionsResult] = await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, username, balance_withdrawn_total, created_at, pix_key")
        .eq("role", "teacher")
        .order("created_at", { ascending: false }),
      admin
        .from("profiles")
        .select("id, subscription_status, referred_by")
        .not("referred_by", "is", null),
      admin
        .from("teacher_commission_entries")
        .select("teacher_id, amount, settled_at"),
    ]);
    if (teachersResult.error) throw teachersResult.error;
    if (studentsResult.error) throw studentsResult.error;
    if (commissionsResult.error) throw commissionsResult.error;

    const students = studentsResult.data ?? [];
    const commissions = commissionsResult.data ?? [];
    const teachers = (teachersResult.data ?? []).map((teacher) => {
      const referredStudents = students.filter(
        (student) => student.referred_by === teacher.id,
      );
      const teacherEntries = commissions.filter(
        (entry) => entry.teacher_id === teacher.id,
      );
      const lifetimeNet = teacherEntries.reduce(
        (sum, entry) => sum + Number(entry.amount || 0),
        0,
      );
      const unsettledNet = teacherEntries
        .filter((entry) => !entry.settled_at)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

      return {
        ...teacher,
        totalStudents: referredStudents.length,
        activeStudents: referredStudents.filter(
          (student) => student.subscription_status === "active",
        ).length,
        estimatedRevenue: Number(lifetimeNet.toFixed(2)),
        formattedRevenue: Math.max(0, Number(unsettledNet.toFixed(2))),
      };
    });

    return NextResponse.json({ teachers });
  } catch (error: unknown) {
    console.error("Admin teachers route error:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os professores." },
      { status: 500 },
    );
  }
}
