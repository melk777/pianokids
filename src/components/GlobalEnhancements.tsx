"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const StarryBackground = dynamic(() => import("@/components/StarryBackground"), {
  ssr: false,
  loading: () => null,
});

const GlobalSocialOverlay = dynamic(() => import("@/components/Social/GlobalSocialOverlay"), {
  ssr: false,
  loading: () => null,
});

export default function GlobalEnhancements() {
  const pathname = usePathname();
  const shouldLoadEnhancements = pathname?.startsWith("/dashboard");

  if (!shouldLoadEnhancements) {
    return null;
  }

  return (
    <>
      <StarryBackground />
      <GlobalSocialOverlay />
    </>
  );
}
