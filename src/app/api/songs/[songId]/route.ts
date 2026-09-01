import { NextResponse } from "next/server";
import { canAccessSong } from "@/lib/access-control";
import { getServerSongById, getServerSongMetadata } from "@/lib/server/song-catalog";
import { getServerViewer } from "@/lib/server/viewer";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ songId: string }> },
) {
  const { songId } = await params;
  const viewer = await getServerViewer();

  if (!viewer) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (viewer.role !== "student") {
    return NextResponse.json(
      { error: "A biblioteca de aluno nao esta disponivel para este perfil." },
      { status: 403 },
    );
  }

  const metadata = await getServerSongMetadata(songId);
  if (!metadata) {
    return NextResponse.json({ error: "Musica nao encontrada." }, { status: 404 });
  }

  if (
    !canAccessSong(metadata, viewer.profile, {
      hasSpecialAccess: viewer.specialAccess,
    })
  ) {
    return NextResponse.json(
      { error: "Esta musica requer o Pianify Pro.", code: "premium_required" },
      { status: 403 },
    );
  }

  const song = await getServerSongById(songId);
  if (!song) {
    return NextResponse.json({ error: "Musica nao encontrada." }, { status: 404 });
  }

  return NextResponse.json(song, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
