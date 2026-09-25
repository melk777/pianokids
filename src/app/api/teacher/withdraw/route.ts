import { NextResponse } from "next/server";
import {
  createServerSupabaseReadClient,
  createSupabaseAdminClient,
  getOptionalSupabaseUser,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

async function requireTeacher() {
  const supabase = await createServerSupabaseReadClient();
  const user = await getOptionalSupabaseUser(supabase);
  if (!user) return { response: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (profile?.role !== "teacher") {
    return { response: NextResponse.json({ error: "Acesso exclusivo para professores." }, { status: 403 }) };
  }

  return { supabase, user };
}

export async function GET() {
  try {
    const auth = await requireTeacher();
    if ("response" in auth) return auth.response;

    const admin = createSupabaseAdminClient();
    const { data: withdrawals, error } = await admin
      .from("withdrawals")
      .select("id, amount, status, created_at, updated_at")
      .eq("teacher_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ withdrawals: withdrawals ?? [] });
  } catch (error: unknown) {
    console.error("Teacher withdrawals read error:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os saques." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const auth = await requireTeacher();
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase.rpc("request_teacher_withdrawal");
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Já existe uma solicitação de saque pendente." },
          { status: 409 },
        );
      }
      if (error.code === "22023") {
        return NextResponse.json(
          { error: "Não há saldo liberado para saque." },
          { status: 400 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, withdrawal: data });
  } catch (error: unknown) {
    console.error("Teacher withdrawal request error:", error);
    return NextResponse.json(
      { error: "Não foi possível solicitar o saque." },
      { status: 500 },
    );
  }
}
