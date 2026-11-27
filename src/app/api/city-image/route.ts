import { NextRequest, NextResponse } from "next/server";
import {
  cityImageQuery,
  curatedCityImage,
  type CityImageResult,
} from "@/modules/marketing/cityImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const memory = new Map<string, { at: number; data: CityImageResult }>();
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

async function fromUnsplash(query: string): Promise<CityImageResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  const url =
    `https://api.unsplash.com/search/photos` +
    `?query=${encodeURIComponent(query)}` +
    `&orientation=landscape&per_page=1&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: Array<{
      urls?: { regular?: string; small?: string };
      user?: { name?: string };
    }>;
  };
  const hit = json.results?.[0];
  const photo = hit?.urls?.regular || hit?.urls?.small;
  if (!photo) return null;
  return {
    url: photo,
    source: "unsplash",
    photographer: hit?.user?.name,
  };
}

async function fromPexels(query: string): Promise<CityImageResult | null> {
  const key = process.env.PEXELS_API_KEY || process.env.NEXT_PUBLIC_PEXELS_API_KEY;
  if (!key) return null;
  const url =
    `https://api.pexels.com/v1/search` +
    `?query=${encodeURIComponent(query)}` +
    `&orientation=landscape&per_page=1`;
  const res = await fetch(url, {
    headers: { Authorization: key },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    photos?: Array<{
      src?: { large?: string; landscape?: string; medium?: string };
      photographer?: string;
    }>;
  };
  const hit = json.photos?.[0];
  const photo = hit?.src?.landscape || hit?.src?.large || hit?.src?.medium;
  if (!photo) return null;
  return {
    url: photo,
    source: "pexels",
    photographer: hit?.photographer,
  };
}

export async function GET(req: NextRequest) {
  const city = (req.nextUrl.searchParams.get("city") || "").trim();
  const country = (req.nextUrl.searchParams.get("country") || "PK").trim().toUpperCase();
  if (!city) {
    return NextResponse.json({ success: false, error: "city required" }, { status: 400 });
  }

  const cacheKey = `${city.toLowerCase()}|${country}`;
  const cached = memory.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json(
      { success: true, data: cached.data },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  }

  const query = cityImageQuery(city, country);
  let data: CityImageResult | null = null;
  try {
    data = (await fromUnsplash(query)) || (await fromPexels(query));
  } catch {
    data = null;
  }

  if (!data) {
    data = {
      url: curatedCityImage(city, country),
      source: "curated",
    };
  }

  memory.set(cacheKey, { at: Date.now(), data });
  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
