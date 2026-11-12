const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message || json.message || "Request failed");
  }
  return json as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message || json.message || "Request failed");
  }
  return json as T;
}

function withCountry(path: string, country?: string) {
  if (!country) return path;
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}country=${encodeURIComponent(country)}`;
}

export type PublicExpert = {
  id: string;
  name: string;
  work: string | null;
  city: string | null;
  country?: string | null;
  placeLabel: string | null;
  photoUrl: string | null;
  rating: number;
  ratingCount: number;
  package: string;
  isOnline: boolean;
  topRanked?: boolean;
};

export const marketingApi = {
  overview(country?: string) {
    return get<{
      success: boolean;
      data: {
        overview: {
          experts: number;
          online: number;
          liveShops: number;
          ratingAvg: number;
          ratingCount: number;
          cities: number;
          country?: string;
        };
      };
    }>(withCountry("/api/public/overview", country));
  },
  search(params: {
    q?: string;
    city?: string;
    category?: string;
    country?: string;
    page?: number;
    pageSize?: number;
  }) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    });
    return get<{
      success: boolean;
      data: {
        total: number;
        page: number;
        pageSize: number;
        liveShops: number;
        experts: PublicExpert[];
      };
    }>(`/api/public/search?${sp.toString()}`);
  },
  cities(country?: string) {
    return get<{
      success: boolean;
      data: {
        cities: Array<{ city: string; experts: number; shops: number; country?: string }>;
        country?: string;
      };
    }>(withCountry("/api/public/cities", country || "PK"));
  },
  categories(country?: string) {
    return get<{
      success: boolean;
      data: { categories: Array<{ name: string; experts: number }> };
    }>(withCountry("/api/public/categories", country));
  },
  reviews(take = 8, country?: string) {
    return get<{
      success: boolean;
      data: {
        reviews: Array<{
          id: string;
          stars: number;
          text: string | null;
          createdAt: string;
          from: {
            name: string;
            photoUrl: string | null;
            work: string | null;
            city: string | null;
          };
          about: { name: string; work: string | null; city: string | null };
        }>;
      };
    }>(withCountry(`/api/public/reviews?take=${take}`, country));
  },
  contact(body: {
    name: string;
    email: string;
    message: string;
    city?: string;
    country?: string;
    subject?: string;
    kind?: "CONTACT" | "COMPLAINT";
  }) {
    return post<{ success: boolean; message?: string }>("/api/public/contact", body);
  },
};
