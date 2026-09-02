import { NextResponse } from "next/server";
import {
  createServerSupabaseReadClient,
  createSupabaseAdminClient,
  getOptionalSupabaseUser,
} from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

async function loadAllRows(table: string, column: string, userId: string) {
  const admin = createSupabaseAdminClient();
  const rows: unknown[] = [];
  const pageSize = 500;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .eq(column, userId)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }

  return rows;
}

function mergeUniqueRows(...groups: unknown[][]) {
  const merged = new Map<string, unknown>();
  for (const row of groups.flat()) {
    const key =
      row && typeof row === "object" && "id" in row
        ? String((row as { id: unknown }).id)
        : JSON.stringify(row);
    merged.set(key, row);
  }
  return [...merged.values()];
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseReadClient();
    const user = await getOptionalSupabaseUser(supabase);
    if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const [
      profiles,
      practiceSessions,
      recommendations,
      withdrawals,
      billingInvoices,
      analyticsEvents,
      sentFriendships,
      receivedFriendships,
      sentMessages,
      receivedMessages,
      teacherCommissions,
      studentCommissions,
    ] = await Promise.all([
      loadAllRows("profiles", "id", user.id),
      loadAllRows("practice_sessions", "user_id", user.id),
      loadAllRows("song_recommendations", "user_id", user.id),
      loadAllRows("withdrawals", "teacher_id", user.id),
      loadAllRows("billing_invoices", "user_id", user.id),
      loadAllRows("analytics_events", "user_id", user.id),
      loadAllRows("friendships", "sender_id", user.id),
      loadAllRows("friendships", "receiver_id", user.id),
      loadAllRows("messages", "sender_id", user.id),
      loadAllRows("messages", "receiver_id", user.id),
      loadAllRows("teacher_commission_entries", "teacher_id", user.id),
      loadAllRows("teacher_commission_entries", "student_id", user.id),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        metadata: user.user_metadata,
      },
      profile: profiles[0] ?? null,
      practiceSessions,
      songRecommendations: recommendations,
      withdrawals,
      billingInvoices,
      analyticsEvents,
      friendships: mergeUniqueRows(sentFriendships, receivedFriendships),
      messages: mergeUniqueRows(sentMessages, receivedMessages),
      commissionEntries: mergeUniqueRows(teacherCommissions, studentCommissions),
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pianify-dados-${user.id}.json"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Account export error:", error);
    return NextResponse.json(
      { error: "Não foi possível preparar a exportação dos dados." },
      { status: 500 },
    );
  }
}
