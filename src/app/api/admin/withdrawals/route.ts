import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Join withdrawal using foreign key
    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select(`
         *,
         profiles:teacher_id(full_name, username, pix_key, balance_withdrawn_total)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { withdrawal_id, status, receipt_url, teacher_id, amount } = await request.json();
    if (!withdrawal_id || !status) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (adminProfile?.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Atualiza o documento de saque!
    const { error: updErr } = await supabase
      .from("withdrawals")
      .update({ status, receipt_url, updated_at: new Date().toISOString() })
      .eq('id', withdrawal_id);

    if (updErr) throw updErr;

    // Se aprovado, debitar na conta espelho do professor (marcar como sacado)
    if (status === 'concluido' || status === 'aprovado') {
        const { data: profBase } = await supabase.from('profiles').select('balance_withdrawn_total').eq('id', teacher_id).single();
        const currentSum = Number(profBase?.balance_withdrawn_total || 0);
        
        await supabase
          .from("profiles")
          .update({ balance_withdrawn_total: currentSum + Number(amount) })
          .eq('id', teacher_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
