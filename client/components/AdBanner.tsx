import React, { useEffect, useState } from "react";
import { Advertisement } from "@shared/types";

interface AdBannerProps {
  placement: "login" | "app";
  className?: string;
}

export function AdBanner({ placement, className }: AdBannerProps) {
  const [ads, setAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/ads/active?placement=${placement}`);
        if (!res.ok) return;
        const data = (await res.json()) as Advertisement[];
        setAds(data || []);
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [placement]);

  if (!ads.length) return null;

  // Show first active for now; can rotate later
  const ad = ads[0];
  const isVertical = ad.orientation === "vertical";

  return (
    <div
      className={
        className ||
        (isVertical
          ? "w-full max-w-md mx-auto mb-4"
          : "w-full mx-auto mb-4")
      }
    >
      <img
        src={ad.mediaUrl}
        alt="Sponsored"
        className={
          isVertical
            ? "w-full h-auto rounded-xl shadow-professional"
            : "w-full h-40 sm:h-48 md:h-56 object-cover rounded-xl shadow-professional"
        }
      />
    </div>
  );
}
