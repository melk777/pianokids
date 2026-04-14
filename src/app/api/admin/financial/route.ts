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
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Prices matching Front Page
    const PRICE_MONTHLY = 29.90;
    const PRICE_YEARLY = 239.90;
    const GATEWAY_FEE = 0.05; // 5%

    // Pick all active students
    const { data: students, error: errS } = await supabase
      .from("profiles")
      .select("created_at, subscription_plan_interval")
      .in("subscription_status", ["active", "admin_granted"])
      .not("role", "eq", "teacher");

    if (errS) throw errS;

    // Withdrawals (Payouts)
    const { data: withdrawals, error: errW } = await supabase
      .from("withdrawals")
      .select("amount, created_at")
      .in("status", ["concluido", "aprovado"]);

    if (errW) throw errW;

    // Company Expenses (CSTs)
    const { data: rawExpenses, error: errCST } = await supabase.from("company_expenses").select("*");
    if (errCST) throw errCST;
    
    // Create mapping for expenses string format "YYYY-MM"
    // Create mapping for expenses string format "YYYY-MM"
    const expensesMap: Record<string, { marketing: number, development: number, copyrights: number, other: number, [key: string]: unknown }> = {};
    (rawExpenses || []).forEach((e: { month_year: string, marketing: number, development: number, copyrights: number, other: number, [key: string]: unknown }) => { expensesMap[e.month_year] = e; });

    // --- Time Series Builder (Últimos 12 Meses até o Mês Atual) ---
    const now = new Date();
    const monthsArray = [];
    
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsArray.push({
            year: d.getFullYear(),
            monthIndex: d.getMonth(),
            monthYearKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
            endOfMoth: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).getTime()
        });
    }

    const chartData = monthsArray.map(m => {
       // All active users who started BEFORE OR AT the end of this month
       const activeAtThisMonth = (students || []).filter(s => new Date(s.created_at).getTime() <= m.endOfMoth);
       
       let monthRevenue = 0;
       
       activeAtThisMonth.forEach(s => {
          if (s.subscription_plan_interval === 'year') {
              monthRevenue += (PRICE_YEARLY / 12); // Ponderamento mensal do anual (MRR)
          } else {
              monthRevenue += PRICE_MONTHLY;
          }
       });

       // Find payouts specifically in this month
       const payoutsThisMonth = (withdrawals || []).filter(w => {
           const wd = new Date(w.created_at);
           return wd.getFullYear() === m.year && wd.getMonth() === m.monthIndex;
       });

       const paidToTeachers = payoutsThisMonth.reduce((acc, curr) => acc + Number(curr.amount), 0);
       
       // Fixed Expenses (Manually added by Admin)
       const exp = expensesMap[m.monthYearKey] || { marketing: 0, development: 0, copyrights: 0, other: 0 };
       const additionalCosts = Number(exp.marketing) + Number(exp.development) + Number(exp.copyrights) + Number(exp.other);

       const gatewayCost = monthRevenue * GATEWAY_FEE; // 5% Stripe fees (aprox)
       const netProfit = monthRevenue - paidToTeachers - gatewayCost - additionalCosts;

       return {
           name: m.label,
           faturamento: Number(monthRevenue.toFixed(2)),
           custoProfessores: Number(paidToTeachers.toFixed(2)),
           custosVariaveis: Number(additionalCosts.toFixed(2)),
           lucroLiquido: Math.max(0, Number(netProfit.toFixed(2)))
       };
    });

    // --- Absolute Metrics Calculation (Current Snapshop) ---
    let currentMonthlyRevenue = 0;
    let currentYearlyRevenue = 0; // Pure ARR part
    
    (students || []).forEach(s => {
        if (s.subscription_plan_interval === 'year') {
            currentYearlyRevenue += PRICE_YEARLY;
        } else {
            currentMonthlyRevenue += PRICE_MONTHLY;
        }
    });

    const mrr = currentMonthlyRevenue + (currentYearlyRevenue / 12);
    const arr = mrr * 12;

    // Month to date outputs
    const currentMonthData = chartData[chartData.length - 1];

    return NextResponse.json({
        chartData,
        mrr,
        arr,
        revenueMonthlyPlan: currentMonthlyRevenue,
        revenueYearlyPlan: currentYearlyRevenue,
        monthGatewayCost: currentMonthData.faturamento * GATEWAY_FEE,
        monthTeacherPayouts: currentMonthData.custoProfessores,
        monthNetProfit: currentMonthData.lucroLiquido
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
