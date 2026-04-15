"use client";

import SupportedVideo from "./SupportedVideo";

export default function HeroVideo() {
  return (
    <div className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-black pointer-events-none">
      <div className="absolute inset-0 z-10 bg-black/50" />
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/70 via-transparent to-black" />

      <SupportedVideo
        src="/videos/hero-bg.webm"
        type="video/webm"
        poster="/images/covers/golden_hour_cover.png"
        alt="Prévia visual da experiência Pianify"
        className="h-full w-full object-cover opacity-100"
        fallbackClassName="relative h-full w-full"
        observeVisibility
      />
    </div>
  );
}
