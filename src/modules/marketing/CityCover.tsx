"use client";

import { useEffect, useState } from "react";
import { curatedCityImage } from "./cityImage";

const GRADIENTS = [
  "from-[#1b3c33]/90 to-[#2d6b58]/70",
  "from-[#8c5a0c]/90 to-[#e09a2b]/70",
  "from-[#1f7a62]/90 to-[#14332b]/70",
  "from-[#5b4db8]/90 to-[#1b3c33]/70",
  "from-[#14332b]/90 to-[#4a5c54]/70",
  "from-[#c45c6a]/90 to-[#8c5a0c]/70",
];

type Props = {
  city: string;
  countryCode: string;
  title: string;
  index?: number;
  className?: string;
  titleClassName?: string;
};

/**
 * Famous-place cover for a city. Loads a live Unsplash/Pexels photo via
 * /api/city-image (falls back to curated Unsplash landmark URLs).
 */
export function CityCover({
  city,
  countryCode,
  title,
  index = 0,
  className = "h-36",
  titleClassName = "font-display text-2xl font-bold",
}: Props) {
  const fallback = curatedCityImage(city, countryCode);
  const [src, setSrc] = useState(fallback);
  const overlay = GRADIENTS[index % GRADIENTS.length];

  useEffect(() => {
    let cancelled = false;
    const nextFallback = curatedCityImage(city, countryCode);
    setSrc(nextFallback);

    const qs = new URLSearchParams({ city, country: countryCode });
    void fetch(`/api/city-image?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { success?: boolean; data?: { url?: string } } | null) => {
        const url = json?.data?.url;
        if (!cancelled && url) setSrc(url);
      })
      .catch(() => {
        /* keep curated fallback */
      });

    return () => {
      cancelled = true;
    };
  }, [city, countryCode]);

  return (
    <div className={`relative flex items-end overflow-hidden px-4 py-3 text-paper ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setSrc(fallback)}
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${overlay}`} />
      <h2 className={`relative z-[1] drop-shadow-sm ${titleClassName}`}>{title}</h2>
    </div>
  );
}
