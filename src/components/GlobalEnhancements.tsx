"use client";

import dynamic from "next/dynamic";

const StarryBackground = dynamic(() => import("@/components/StarryBackground"), {
  ssr: false,
  loading: () => null,
});

const GlobalSocialOverlay = dynamic(() => import("@/components/Social/GlobalSocialOverlay"), {
  ssr: false,
  loading: () => null,
});

export default function GlobalEnhancements() {
  return (
    <>
      <StarryBackground />
      <GlobalSocialOverlay />
    </>
  );
}
