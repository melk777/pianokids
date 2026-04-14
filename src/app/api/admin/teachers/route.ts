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

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    // Buscando todos os professores e todos os estudantes que possuem referred_by preenchido
    const { data: teachers, error: errT } = await supabase
      .from("profiles")
      .select("id, full_name, username, balance_withdrawn_total, created_at, pix_key")
      .eq("role", "teacher")
      .order("created_at", { ascending: false });

    if (errT) throw errT;

    const { data: students, error: errS } = await supabase
      .from("profiles")
      .select("id, full_name, username, subscription_status, subscription_plan_interval, referred_by")
      .not("referred_by", "is", null);

    if (errS) throw errS;

    interface TeacherProf {
      id: string;
      balance_withdrawn_total: number | null;
      [key: string]: unknown;
    }
    interface StudentProf {
      referred_by?: string | null;
      subscription_status?: string | null;
      subscription_plan_interval?: string | null;
      [key: string]: unknown;
    }

    const teacherStats = teachers.map((teacher: TeacherProf) => {
        const referredStudents = students.filter((s: StudentProf) => s.referred_by === teacher.id);
        const activeStudents = referredStudents.filter((s: StudentProf) => s.subscription_status === 'active' || s.subscription_status === 'admin_granted');
        
        let estimatedRevenue = 0;
        activeStudents.forEach((s: StudentProf) => {
           estimatedRevenue += (s.subscription_plan_interval === 'year' ? 40 : 5);
        });

        return {
            ...teacher,
            totalStudents: referredStudents.length,
            activeStudents: activeStudents.length,
            estimatedRevenue,
            formattedRevenue: Math.max(0, estimatedRevenue - Number(teacher.balance_withdrawn_total || 0))
        };
    });

    return NextResponse.json({ teachers: teacherStats });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
