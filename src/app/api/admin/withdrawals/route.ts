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

    const withdrawalsWithSignedReceipts = await Promise.all(
      (withdrawals ?? []).map(async (withdrawal) => {
        if (!withdrawal.receipt_path) {
          return { ...withdrawal, receipt_url: null };
        }

        const { data } = await supabase.storage
          .from("receipts")
          .createSignedUrl(withdrawal.receipt_path, 60 * 60);

        return { ...withdrawal, receipt_url: data?.signedUrl ?? null };
      }),
    );

    return NextResponse.json({ withdrawals: withdrawalsWithSignedReceipts });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { withdrawal_id, status, receipt_path } = await request.json();
    const allowedStatuses = new Set(["pendente", "aprovado", "concluido", "rejeitado"]);

    if (typeof withdrawal_id !== "string" || !allowedStatuses.has(status)) {
      return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });
    }

    let normalizedReceiptPath: string | null = null;
    if (receipt_path) {
      const candidate = String(receipt_path);
      if (!/^[0-9a-f-]{36}_\d+\.(?:jpg|png|webp|pdf)$/i.test(candidate)) {
        return NextResponse.json({ error: "Caminho do comprovante invalido" }, { status: 400 });
      }
      normalizedReceiptPath = candidate;
    }

    if (status === "aprovado" && !normalizedReceiptPath) {
      return NextResponse.json({ error: "Comprovante obrigatorio para aprovar" }, { status: 400 });
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

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("id, teacher_id, amount, status")
      .eq("id", withdrawal_id)
      .maybeSingle();

    if (withdrawalError) throw withdrawalError;
    if (!withdrawal) {
      return NextResponse.json({ error: "Saque nao encontrado" }, { status: 404 });
    }

    const { data: updatedWithdrawal, error: updErr } = await supabase
      .from("withdrawals")
      .update({
        status,
        receipt_path: normalizedReceiptPath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawal.id)
      .select("id, teacher_id, amount, status, receipt_path, updated_at")
      .single();

    if (updErr) throw updErr;

    const { data: paidWithdrawals, error: paidWithdrawalsError } = await supabase
      .from("withdrawals")
      .select("amount")
      .eq("teacher_id", withdrawal.teacher_id)
      .in("status", ["aprovado", "concluido"]);

    if (paidWithdrawalsError) throw paidWithdrawalsError;

    const paidTotal = (paidWithdrawals ?? []).reduce(
      (sum, paidWithdrawal) => sum + Number(paidWithdrawal.amount || 0),
      0,
    );

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ balance_withdrawn_total: paidTotal })
      .eq("id", withdrawal.teacher_id);

    if (profileUpdateError) throw profileUpdateError;

    return NextResponse.json({ success: true, withdrawal: updatedWithdrawal });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
