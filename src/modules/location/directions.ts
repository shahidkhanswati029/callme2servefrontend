export type Coordinates = { lat: number; lng: number };

export type RouteStep = {
  instruction: string;
  distanceM: number;
  durationSec: number;
};

export type DrivingRoute = {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
  steps: RouteStep[];
};

/** Mapbox driving directions with turn-by-turn steps. */
export async function fetchDrivingRoute(
  from: Coordinates,
  to: Coordinates,
  token: string,
  language = "en",
): Promise<DrivingRoute | null> {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?geometries=geojson&overview=full&steps=true&banner_instructions=true` +
    `&language=${encodeURIComponent(language)}&access_token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry?: { coordinates?: [number, number][] };
        legs?: Array<{
          steps?: Array<{
            distance: number;
            duration: number;
            maneuver?: { instruction?: string };
            name?: string;
          }>;
        }>;
      }>;
    };
    const route = json.routes?.[0];
    const coordinates = route?.geometry?.coordinates;
    if (!route || !coordinates?.length) return null;

    const steps: RouteStep[] = [];
    for (const leg of route.legs || []) {
      for (const step of leg.steps || []) {
        const instruction =
          step.maneuver?.instruction || step.name || "Continue";
        steps.push({
          instruction,
          distanceM: Math.round(step.distance || 0),
          durationSec: Math.round(step.duration || 0),
        });
      }
    }

    return {
      coordinates,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      steps,
    };
  } catch {
    return null;
  }
}

export function formatStepDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
