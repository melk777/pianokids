import { NextResponse } from "next/server";
import { createServerSupabaseReadClient, createSupabaseAdminClient } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

type Expense = {
  month_year: string;
  marketing: number;
  development: number;
  copyrights: number;
  other: number;
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseReadClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const [invoicesResult, studentsResult, commissionsResult, expensesResult] =
      await Promise.all([
        admin
          .from("billing_invoices")
          .select("stripe_invoice_id, user_id, amount_paid, amount_refunded, stripe_fee_amount, net_received, currency, plan_interval, status, paid_at")
          .eq("currency", "brl")
          .not("paid_at", "is", null)
          .order("paid_at", { ascending: false })
          .limit(5000),
        admin
          .from("profiles")
          .select("id, subscription_plan_interval")
          .eq("role", "student")
          .eq("subscription_status", "active"),
        admin
          .from("teacher_commission_entries")
          .select("amount, created_at")
          .eq("currency", "brl"),
        admin.from("company_expenses").select("month_year, marketing, development, copyrights, other"),
      ]);

    if (invoicesResult.error) throw invoicesResult.error;
    if (studentsResult.error) throw studentsResult.error;
    if (commissionsResult.error) throw commissionsResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const invoices = invoicesResult.data ?? [];
    const activeStudents = studentsResult.data ?? [];
    const commissions = commissionsResult.data ?? [];
    const expenses = (expensesResult.data ?? []) as Expense[];
    const expensesByMonth = new Map(expenses.map((expense) => [expense.month_year, expense]));

    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const offset = 11 - index;
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date.toLocaleString("pt-BR", { month: "short", year: "2-digit" }),
      };
    });

    const chartData = months.map((month) => {
      const monthInvoices = invoices.filter((invoice) => {
        const paidAt = new Date(invoice.paid_at!);
        return paidAt.getFullYear() === month.year && paidAt.getMonth() === month.month;
      });
      const grossRevenue = monthInvoices.reduce(
        (sum, invoice) =>
          sum + (Number(invoice.amount_paid) - Number(invoice.amount_refunded)) / 100,
        0,
      );
      const gatewayCost = monthInvoices.reduce(
        (sum, invoice) => sum + Number(invoice.stripe_fee_amount) / 100,
        0,
      );
      const teacherCosts = commissions
        .filter((entry) => {
          const recognizedAt = new Date(entry.created_at);
          return recognizedAt.getFullYear() === month.year && recognizedAt.getMonth() === month.month;
        })
        .reduce((sum, entry) => sum + Number(entry.amount), 0);

      const expense = expensesByMonth.get(month.key);
      const otherCosts = expense
        ? Number(expense.marketing) +
          Number(expense.development) +
          Number(expense.copyrights) +
          Number(expense.other)
        : 0;
      const netProfit = grossRevenue - gatewayCost - teacherCosts - otherCosts;

      return {
        name: month.label,
        faturamento: Number(grossRevenue.toFixed(2)),
        custoProfessores: Number(teacherCosts.toFixed(2)),
        custosVariaveis: Number((gatewayCost + otherCosts).toFixed(2)),
        lucroLiquido: Number(netProfit.toFixed(2)),
      };
    });

    const latestInvoiceByUser = new Map<string, (typeof invoices)[number]>();
    for (const invoice of invoices) {
      if (invoice.user_id && !latestInvoiceByUser.has(invoice.user_id)) {
        latestInvoiceByUser.set(invoice.user_id, invoice);
      }
    }

    let revenueMonthlyPlan = 0;
    let revenueYearlyPlan = 0;
    for (const student of activeStudents) {
      const invoice = latestInvoiceByUser.get(student.id);
      if (!invoice) continue;
      const netBilled =
        (Number(invoice.amount_paid) - Number(invoice.amount_refunded)) / 100;
      if ((invoice.plan_interval ?? student.subscription_plan_interval) === "year") {
        revenueYearlyPlan += netBilled;
      } else {
        revenueMonthlyPlan += netBilled;
      }
    }

    const mrr = revenueMonthlyPlan + revenueYearlyPlan / 12;
    const currentMonth = chartData.at(-1)!;
    const currentMonthKey = months.at(-1)!.key;
    const currentMonthInvoices = invoices.filter(
      (invoice) => invoice.paid_at?.slice(0, 7) === currentMonthKey,
    );
    const monthGatewayCost = currentMonthInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.stripe_fee_amount) / 100,
      0,
    );

    return NextResponse.json({
      chartData,
      mrr: Number(mrr.toFixed(2)),
      arr: Number((mrr * 12).toFixed(2)),
      revenueMonthlyPlan: Number(revenueMonthlyPlan.toFixed(2)),
      revenueYearlyPlan: Number(revenueYearlyPlan.toFixed(2)),
      monthGatewayCost: Number(monthGatewayCost.toFixed(2)),
      monthTeacherPayouts: currentMonth.custoProfessores,
      monthNetProfit: currentMonth.lucroLiquido,
    });
  } catch (error: unknown) {
    console.error("Admin financial route error:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os dados financeiros conciliados." },
      { status: 500 },
    );
  }
}
