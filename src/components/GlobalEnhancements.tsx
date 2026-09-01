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
  const socialFeaturesEnabled = process.env.NEXT_PUBLIC_SOCIAL_FEATURES_ENABLED === "true";

  if (!shouldLoadEnhancements) {
    return null;
  }

  return (
    <>
      <StarryBackground />
      {socialFeaturesEnabled && <GlobalSocialOverlay />}
    </>
  );
}
