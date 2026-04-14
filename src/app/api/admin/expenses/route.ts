import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function isValidMonthYear(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("month_year");

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

    if (monthYear && !isValidMonthYear(monthYear)) {
      return NextResponse.json({ error: "Formato de mes invalido" }, { status: 400 });
    }

    if (monthYear) {
      const { data, error } = await supabase.from("company_expenses").select("*").eq("month_year", monthYear).maybeSingle();
      if (error) throw error;
      return NextResponse.json(data || { month_year: monthYear, marketing: 0, development: 0, copyrights: 0, other: 0 });
    }

    const { data, error } = await supabase.from("company_expenses").select("*");
    if (error) throw error;
    return NextResponse.json({ expenses: data || [] });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { month_year, marketing, development, copyrights, other } = await request.json();
    if (!isValidMonthYear(month_year)) return NextResponse.json({ error: "Dados invalidos" }, { status: 400 });

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

    const { error: upsertErr } = await supabase
      .from("company_expenses")
      .upsert({
        month_year,
        marketing: Number(marketing) || 0,
        development: Number(development) || 0,
        copyrights: Number(copyrights) || 0,
        other: Number(other) || 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "month_year" });

    if (upsertErr) throw upsertErr;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthYear = searchParams.get("month_year");
    if (!isValidMonthYear(monthYear)) return NextResponse.json({ error: "Invalido" }, { status: 400 });

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

    const { error: delErr } = await supabase.from("company_expenses").delete().eq("month_year", monthYear);
    if (delErr) throw delErr;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
