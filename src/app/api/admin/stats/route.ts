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

    // Usaremos Service Role para by-pass RLS restrito de perfis se necessário,
    // mas construimos a RLS Policy para admin poder ler "profiles" e "withdrawals".
    
    // Total users and break down by plan interval and role
    const { data: profiles, error: errProfiles } = await supabase
      .from("profiles")
      .select("id, role, subscription_status, subscription_plan_interval, created_at, referred_by, balance_withdrawn_total");

    if (errProfiles) throw errProfiles;

    let totalStudents = 0;
    let totalMonthly = 0;
    let totalYearly = 0;
    let totalTeachers = 0;
    
    let totalEarnedGlobal = 0;
    let totalEarnedMature = 0;
    let totalPaidFromTeacherProfiles = 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    profiles.forEach(p => {
      if (p.role === 'teacher') {
         totalTeachers++;
         totalPaidFromTeacherProfiles += Number(p.balance_withdrawn_total || 0);
      } else {
         totalStudents++;
         const isActive = (p.subscription_status === 'active' || p.subscription_status === 'admin_granted');
         
         if (isActive) {
             const isYearly = p.subscription_plan_interval === 'year';
             if (isYearly) {
                 totalYearly++;
             } else {
                 totalMonthly++;
             }

             // Se esse aluno foi indicado por alguém, gera dívida/comissão
             if (p.referred_by) {
                const commission = isYearly ? 40.0 : 5.0;
                totalEarnedGlobal += commission;

                const registrationDate = new Date(p.created_at);
                if (registrationDate < thirtyDaysAgo) {
                    totalEarnedMature += commission;
                }
             }
         }
      }
    });

    const { data: withdrawals, error: errWith } = await supabase.from("withdrawals").select("amount, status");
    if (errWith) throw errWith;

    let totalPendingValue = 0;

    // totalPendingValue são apenas as REQUISIÇÕES em aberto (na fila do PIX)
    withdrawals.forEach(w => {
      if (w.status === 'pendente') totalPendingValue += Number(w.amount);
    });

    // Cálculos de Dívida da Plataforma (Levando em conta o que já foi deduzido via pagamento)
    // Divida Madura = Potencial de saque imediato de todos os professores
    // Divida Total = Potencial imediato + Comissões que ainda vão amadurecer
    const debtMature = Math.max(0, totalEarnedMature - totalPaidFromTeacherProfiles);
    const debtGlobal = Math.max(0, totalEarnedGlobal - totalPaidFromTeacherProfiles);

    return NextResponse.json({
      totalStudents,
      totalActiveMonthly: totalMonthly,
      totalActiveYearly: totalYearly,
      totalTeachers,
      totalPendingValue, // Solicitações de saque em aberto
      totalPaidValue: totalPaidFromTeacherProfiles,
      debtMature,
      debtGlobal
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
