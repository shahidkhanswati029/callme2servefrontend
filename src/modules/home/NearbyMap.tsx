"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyExpert } from "@/modules/location/api";
import {
  fetchDrivingRoute,
  formatStepDistance,
  type Coordinates,
  type DrivingRoute,
  type RouteStep,
} from "@/modules/location/directions";

type Props = {
  accountLat?: number | null;
  accountLng?: number | null;
  currentLocation: Coordinates | null;
  experts: NearbyExpert[];
  /** When set (e.g. from list “Directions”), focus that expert’s route. */
  focusExpertId?: string | null;
};

const ROUTE_SOURCE = "cmts-work-route";
const ROUTE_LAYER = "cmts-work-route-line";

function validCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): Coordinates | null {
  if (
    latitude == null ||
    longitude == null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }
  return { lat: latitude, lng: longitude };
}

function haversineKm(a: Coordinates, b: Coordinates): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
}

function makeDot(color: string, size: number, label?: string) {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.cursor = "pointer";

  if (label) {
    const badge = document.createElement("div");
    badge.textContent = label;
    badge.style.background = "#244b3c";
    badge.style.color = "#f7f3ea";
    badge.style.fontSize = "11px";
    badge.style.fontWeight = "700";
    badge.style.padding = "2px 6px";
    badge.style.borderRadius = "999px";
    badge.style.marginBottom = "4px";
    badge.style.whiteSpace = "nowrap";
    badge.style.boxShadow = "0 2px 6px rgba(26,40,34,0.25)";
    wrap.appendChild(badge);
  }

  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "999px";
  el.style.background = color;
  el.style.border = "3px solid #fff";
  el.style.boxShadow = "0 2px 8px rgba(26,40,34,0.35)";
  wrap.appendChild(el);
  return wrap;
}

function clearRoute(map: mapboxgl.Map) {
  if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER);
  if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE);
}

function drawRoute(map: mapboxgl.Map, coordinates: [number, number][]) {
  clearRoute(map);
  map.addSource(ROUTE_SOURCE, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    },
  });
  map.addLayer({
    id: ROUTE_LAYER,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "#244b3c",
      "line-width": 5,
      "line-opacity": 0.92,
    },
  });
}

export function NearbyMap({
  accountLat,
  accountLng,
  currentLocation,
  experts,
  focusExpertId = null,
}: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const watchId = useRef<number | null>(null);
  const destRef = useRef<{ expert: NearbyExpert; position: Coordinates } | null>(null);
  const lastRouteAt = useRef(0);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [routeSummary, setRouteSummary] = useState("");
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [activeDest, setActiveDest] = useState<{
    name: string;
    position: Coordinates;
  } | null>(null);
  const [following, setFollowing] = useState(false);
  const [liveRemainingKm, setLiveRemainingKm] = useState<number | null>(null);

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setMapError("Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local.");
      return;
    }

    let cancelled = false;
    mapboxgl.accessToken = token;

    const saved = validCoordinates(accountLat, accountLng);
    const center = currentLocation || saved || { lat: 32.4927, lng: 74.5319 };

    const map = new mapboxgl.Map({
      container: mapElement.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [center.lng, center.lat],
      zoom: 14,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "top-right",
    );
    mapInstance.current = map;

    map.on("error", (e) => {
      if (cancelled) return;
      const msg = e.error?.message || "Unable to load Mapbox map.";
      if (/401|403|unauthorized|invalid/i.test(msg)) {
        setMapError(
          "Mapbox token rejected. Check NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN and token URL restrictions.",
        );
      } else {
        setMapError(msg);
      }
    });

    map.on("load", () => {
      if (cancelled) return;
      setMapError("");
      setReady(true);
    });

    return () => {
      cancelled = true;
      if (watchId.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      if (mapInstance.current) {
        try {
          clearRoute(mapInstance.current);
        } catch {
          // ignore
        }
      }
      map.remove();
      mapInstance.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!map || !ready || !token) return;

    let cancelled = false;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    const saved = validCoordinates(accountLat, accountLng);
    const myLocation = currentLocation || saved;

    const expertLocations = experts
      .map((expert) => ({
        expert,
        position: validCoordinates(expert.latitude, expert.longitude),
      }))
      .filter(
        (item): item is { expert: NearbyExpert; position: Coordinates } =>
          item.position !== null,
      );

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    if (myLocation) {
      const marker = new mapboxgl.Marker({ element: makeDot("#244b3c", 18) })
        .setLngLat([myLocation.lng, myLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 16 }).setHTML(
            `<strong>${currentLocation ? "Your current GPS" : "Your saved place"}</strong>`,
          ),
        )
        .addTo(map);
      markers.current.push(marker);
      bounds.extend([myLocation.lng, myLocation.lat]);
      hasMarkers = true;
    }

    const applyRoute = async (expert: NearbyExpert, position: Coordinates) => {
      if (!myLocation) {
        setRouteSummary("Set GPS or place pin to get directions.");
        setSteps([]);
        setActiveDest(null);
        return;
      }
      destRef.current = { expert, position };
      setActiveDest({ name: expert.name, position });
      setRouteSummary("Loading directions…");
      setSteps([]);
      setLiveRemainingKm(null);

      const route: DrivingRoute | null = await fetchDrivingRoute(
        myLocation,
        position,
        token,
      );
      if (cancelled) return;
      if (!route) {
        const straight = haversineKm(myLocation, position);
        clearRoute(map);
        setRouteSummary(`Route unavailable · ${straight} km straight to ${expert.name}`);
        setSteps([]);
        return;
      }
      drawRoute(map, route.coordinates);
      setRouteSummary(
        `To ${expert.name}: ${route.distanceKm} km · ~${route.durationMin} min drive`,
      );
      setSteps(route.steps.slice(0, 24));
      setLiveRemainingKm(route.distanceKm);
      const rb = new mapboxgl.LngLatBounds();
      route.coordinates.forEach((c) => rb.extend(c));
      map.fitBounds(rb, { padding: 56, maxZoom: 15, duration: 700 });
    };

    expertLocations.forEach(({ expert, position }) => {
      const straightKm = myLocation
        ? haversineKm(myLocation, position)
        : expert.distanceKm;
      const kmLabel =
        Number.isFinite(straightKm) && straightKm != null
          ? `${straightKm} km`
          : expert.distanceLabel;
      const marker = new mapboxgl.Marker({ element: makeDot("#b08b48", 14, kmLabel) })
        .setLngLat([position.lng, position.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 14 }).setHTML(
            `<div style="padding:2px;min-width:160px">
              <strong>${expert.name}</strong>
              <div style="font-size:12px;margin-top:4px">${expert.work || "Expert"}</div>
              <div style="font-size:12px;font-weight:700;color:#244b3c">${kmLabel} away</div>
              <div style="font-size:12px">★ ${Number(expert.rating || 0).toFixed(1)} · ${expert.placeLabel || expert.city || ""}</div>
              <div style="font-size:11px;margin-top:6px;color:#5b6b63">Tap for turn-by-turn directions</div>
            </div>`,
          ),
        )
        .addTo(map);
      marker.getElement().addEventListener("click", () => {
        void applyRoute(expert, position);
      });
      markers.current.push(marker);
      bounds.extend([position.lng, position.lat]);
      hasMarkers = true;
    });

    const focused =
      (focusExpertId &&
        expertLocations.find((e) => e.expert.id === focusExpertId)) ||
      expertLocations[0];

    if (myLocation && focused) {
      void applyRoute(focused.expert, focused.position);
    } else if (!focused) {
      clearRoute(map);
      setRouteSummary("");
      setSteps([]);
      setActiveDest(null);
    }

    if (!hasMarkers) {
      const fallback = myLocation || { lat: 32.4927, lng: 74.5319 };
      map.setCenter([fallback.lng, fallback.lat]);
      map.setZoom(14);
    } else if (myLocation && expertLocations.length === 0) {
      map.setCenter([myLocation.lng, myLocation.lat]);
      map.setZoom(16);
    } else if (!focused) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });
    }

    return () => {
      cancelled = true;
    };
  }, [accountLat, accountLng, currentLocation, experts, ready, focusExpertId]);

  function stopFollowing() {
    if (watchId.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    lastRouteAt.current = 0;
    setFollowing(false);
  }

  async function refreshLiveRoute(from: Coordinates, to: Coordinates, name: string) {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const map = mapInstance.current;
    if (!token || !map) return;
    const route = await fetchDrivingRoute(from, to, token);
    if (!route) {
      setLiveRemainingKm(haversineKm(from, to));
      return;
    }
    drawRoute(map, route.coordinates);
    setSteps(route.steps.slice(0, 24));
    setLiveRemainingKm(route.distanceKm);
    setRouteSummary(`To ${name}: ${route.distanceKm} km · ~${route.durationMin} min drive`);
  }

  function startFollowing() {
    const destEntry = destRef.current;
    if (!destEntry || !navigator.geolocation) return;
    const dest = destEntry.position;
    const name = destEntry.expert.name;
    stopFollowing();
    setFollowing(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const remain = haversineKm(here, dest);
        setLiveRemainingKm(remain);
        const map = mapInstance.current;
        if (map) {
          map.easeTo({ center: [here.lng, here.lat], duration: 600 });
        }
        const now = Date.now();
        if (now - lastRouteAt.current > 12000) {
          lastRouteAt.current = now;
          void refreshLiveRoute(here, dest, name);
        }
        if (remain <= 0.05) {
          setRouteSummary("You have reached the destination.");
          stopFollowing();
        }
      },
      () => {
        setFollowing(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-[280px] overflow-hidden rounded-2xl border border-line bg-[#dfe9e2] sm:h-[340px]">
        <div ref={mapElement} className="h-full w-full" />
        {routeSummary ? (
          <div className="animate-rise pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-[#244b3c]/92 px-3 py-2 text-center text-xs font-semibold text-[#f7f3ea] shadow">
            {routeSummary}
            {liveRemainingKm != null && following
              ? ` · ${liveRemainingKm} km left`
              : ""}
          </div>
        ) : null}
        {mapError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#efe8d8] p-5 text-center text-sm">
            {mapError}
          </div>
        ) : null}
      </div>

      {activeDest ? (
        <div className="animate-rise rounded-2xl border border-line bg-cream p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-brass-deep">
                Directions
              </p>
              <p className="font-semibold text-ink">{activeDest.name}</p>
              {liveRemainingKm != null ? (
                <p className="text-xs text-muted">{liveRemainingKm} km remaining</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {following ? (
                <button
                  type="button"
                  onClick={stopFollowing}
                  className="cmts-press cursor-pointer rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold hover:cursor-pointer"
                >
                  Stop navigation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startFollowing}
                  className="cmts-press cursor-pointer rounded-xl bg-forest px-3 py-2 text-xs font-semibold text-paper hover:cursor-pointer"
                >
                  Start navigation
                </button>
              )}
            </div>
          </div>

          {steps.length > 0 ? (
            <ol className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1 text-sm">
              {steps.map((step, i) => (
                <li
                  key={`${i}-${step.instruction.slice(0, 24)}`}
                  className="flex gap-2 rounded-xl border border-line bg-paper px-3 py-2"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mint text-[0.65rem] font-bold text-forest">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="leading-snug text-ink">{step.instruction}</p>
                    <p className="mt-0.5 text-[0.7rem] text-muted">
                      {formatStepDistance(step.distanceM)}
                      {step.durationSec
                        ? ` · ${Math.max(1, Math.round(step.durationSec / 60))} min`
                        : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
