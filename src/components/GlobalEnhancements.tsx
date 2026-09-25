"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

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

  // Teacher invite links point at the home page (/?ref=CODE). Keep the code
  // from any landing page so the signup form can attribute the referral.
  useEffect(() => {
    try {
      const refCode = new URLSearchParams(window.location.search).get("ref")?.trim();
      if (refCode && /^[A-Za-z0-9_-]{1,64}$/.test(refCode)) {
        window.localStorage.setItem("pianify_ref", refCode);
      }
    } catch {
      // Storage can be unavailable (private mode); the signup still works without attribution.
    }
  }, [pathname]);

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
