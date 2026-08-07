import { Music2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
          <span className="absolute inset-0 animate-ping rounded-2xl border border-cyan/20" aria-hidden="true" />
          <Music2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/55">Preparando sua experiência</p>
      </div>
    </main>
  );
}
