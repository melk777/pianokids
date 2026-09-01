import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { canAccessSong } from "@/lib/access-control";
import { getServerSongMetadata } from "@/lib/server/song-catalog";
import { getServerViewer } from "@/lib/server/viewer";

export default async function SongAccessLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  const viewer = await getServerViewer();

  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/play/${songId}`)}`);
  }

  if (viewer.role !== "student") {
    redirect("/dashboard");
  }

  if (songId === "freeplay") return children;

  const song = await getServerSongMetadata(songId);
  if (!song) notFound();

  if (
    !canAccessSong(song, viewer.profile, {
      hasSpecialAccess: viewer.specialAccess,
    })
  ) {
    redirect(
      `/dashboard/subscription?reason=premium&song=${encodeURIComponent(songId)}`,
    );
  }

  return children;
}
