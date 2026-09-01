import { NextResponse } from "next/server";
import { hasPremiumAccess } from "@/lib/access-control";
import { createSupabaseAdminClient } from "@/lib/server/supabase";
import { getServerViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const viewer = await getServerViewer();
    if (!viewer) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (viewer.role !== "student") {
      return NextResponse.json({ error: "Recurso exclusivo para alunos." }, { status: 403 });
    }
    if (!viewer.specialAccess && !hasPremiumAccess(viewer.profile)) {
      return NextResponse.json({ error: "Assinatura Pro necessária." }, { status: 403 });
    }
    if (viewer.isLocalDevelopment) {
      return NextResponse.json({ accepted: true, persisted: false });
    }

    const payload = await request.json().catch(() => null);
    const recommendation =
      typeof payload?.recommendation === "string" ? payload.recommendation.trim() : "";
    if (recommendation.length < 1 || recommendation.length > 500) {
      return NextResponse.json(
        { error: "A sugestão deve ter entre 1 e 500 caracteres." },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data: latest, error: latestError } = await admin
      .from("song_recommendations")
      .select("created_at")
      .eq("user_id", viewer.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestError) throw latestError;
    if (latest && Date.now() - new Date(latest.created_at).getTime() < 30_000) {
      return NextResponse.json(
        { error: "Aguarde alguns segundos antes de enviar outra sugestão." },
        { status: 429 },
      );
    }

    const { error } = await admin.from("song_recommendations").insert({
      user_id: viewer.userId,
      recommendation,
    });
    if (error) throw error;

    return NextResponse.json({ accepted: true, persisted: true }, { status: 201 });
  } catch (error) {
    console.error("Song recommendation error:", error);
    return NextResponse.json(
      { error: "Não foi possível enviar a sugestão agora." },
      { status: 500 },
    );
  }
}
