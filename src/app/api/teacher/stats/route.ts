import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "Configuracao segura do servidor ausente." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("role, referral_code, balance_withdrawn_total")
      .eq("id", user.id)
      .single();

    if (teacherProfile?.role !== "teacher") {
      return NextResponse.json({ error: "Acesso negado. Apenas professores." }, { status: 403 });
    }

    const { data: students, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, subscription_status, subscription_plan_interval, created_at, songs_completed, trophies, last_practice_date")
      .eq("referred_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }

    let activeStudentsCount = 0;
    let balanceAvailableTotal = 0;
    let balancePendingTotal = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const formattedStudents = students?.map((s) => {
      const isActive = s.subscription_status === "active" || s.subscription_status === "admin_granted";
      const isYearly = s.subscription_plan_interval === "year";
      const commissionValue = isYearly ? 40.0 : 5.0;

      if (isActive) {
        activeStudentsCount++;

        const registrationDate = new Date(s.created_at);
        if (registrationDate < thirtyDaysAgo) {
          balanceAvailableTotal += commissionValue;
        } else {
          balancePendingTotal += commissionValue;
        }
      }

      return {
        id: s.id,
        name: s.full_name || "Sem Nome",
        username: s.username || "Sem Email",
        status: isActive ? "Ativo" : "Inativo",
        plan_interval: isYearly ? "Anual" : "Mensal",
        songs_completed: s.songs_completed || 0,
        trophies: s.trophies || 0,
        last_practice: s.last_practice_date || "Nunca praticou",
        created_at: s.created_at,
      };
    }) || [];

    const withdrawn = Number(teacherProfile.balance_withdrawn_total || 0);
    const finalAvailable = Math.max(0, balanceAvailableTotal - withdrawn);

    return NextResponse.json({
      referral_code: teacherProfile.referral_code,
      activeStudents: activeStudentsCount,
      balance_available: finalAvailable,
      balance_pending: balancePendingTotal,
      estimatedEarnings: balanceAvailableTotal + balancePendingTotal,
      students: formattedStudents,
    });
  } catch (error: unknown) {
    const errBase = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: errBase }, { status: 500 });
  }
}
