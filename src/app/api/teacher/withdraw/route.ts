import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function calculateAvailableBalance(userId: string) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    throw new Error("Configuracao segura do servidor ausente.");
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: teacherProfile, error: teacherError } = await supabaseAdmin
    .from("profiles")
    .select("role, balance_withdrawn_total")
    .eq("id", userId)
    .single();

  if (teacherError) {
    throw teacherError;
  }

  if (teacherProfile?.role !== "teacher") {
    throw new Error("Acesso negado. Apenas professores.");
  }

  const { data: students, error: studentsError } = await supabaseAdmin
    .from("profiles")
    .select("subscription_status, subscription_plan_interval, created_at")
    .eq("referred_by", userId);

  if (studentsError) {
    throw studentsError;
  }

  const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  let balanceAvailableTotal = 0;

  for (const student of students || []) {
    const isActive =
      student.subscription_status === "active" ||
      student.subscription_status === "admin_granted";

    if (!isActive) {
      continue;
    }

    const registrationDate = new Date(student.created_at);
    if (registrationDate >= thirtyDaysAgo) {
      continue;
    }

    balanceAvailableTotal += student.subscription_plan_interval === "year" ? 40 : 5;
  }

  const withdrawn = Number(teacherProfile.balance_withdrawn_total || 0);
  const { data: pendingWithdrawals, error: pendingWithdrawalsError } = await supabaseAdmin
    .from("withdrawals")
    .select("amount")
    .eq("teacher_id", userId)
    .eq("status", "pendente");

  if (pendingWithdrawalsError) {
    throw pendingWithdrawalsError;
  }

  const reserved = (pendingWithdrawals ?? []).reduce(
    (sum, withdrawal) => sum + Number(withdrawal.amount || 0),
    0,
  );

  return Math.max(0, balanceAvailableTotal - withdrawn - reserved);
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505",
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select("id, amount, status, created_at, updated_at")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

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
    const body = await request.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Valor invalido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const availableBalance = await calculateAvailableBalance(user.id);
    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Saldo insuficiente para este saque." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .insert([{ teacher_id: user.id, amount, status: "pendente" }])
      .select()
      .single();

    if (error) {
      if (isUniqueViolation(error)) {
        return NextResponse.json(
          { error: "Ja existe uma solicitacao de saque pendente." },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, withdrawal: data });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const status = error.message === "Acesso negado. Apenas professores." ? 403 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
