"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { NearbyExpert } from "@/modules/location/api";

type Coordinates = { lat: number; lng: number };

type Props = {
  accountLat?: number | null;
  accountLng?: number | null;
  currentLocation: Coordinates | null;
  experts: NearbyExpert[];
};

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

function makeDot(color: string, size: number) {
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.borderRadius = "999px";
  el.style.background = color;
  el.style.border = "3px solid #fff";
  el.style.boxShadow = "0 2px 8px rgba(26,40,34,0.35)";
  el.style.cursor = "pointer";
  return el;
}

export function NearbyMap({
  accountLat,
  accountLng,
  currentLocation,
  experts,
}: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState("");

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
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
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
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      map.remove();
      mapInstance.current = null;
      setReady(false);
    };
    // Mount once — markers update in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !ready) return;

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

    expertLocations.forEach(({ expert, position }) => {
      const marker = new mapboxgl.Marker({ element: makeDot("#b08b48", 14) })
        .setLngLat([position.lng, position.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 14 }).setHTML(
            `<div style="padding:2px;min-width:140px"><strong>${expert.name}</strong><div style="font-size:12px;margin-top:4px">${expert.work || "Expert"}</div><div style="font-size:12px">★ ${Number(expert.rating || 0).toFixed(1)} · ${expert.placeLabel || expert.city || ""}</div></div>`,
          ),
        )
        .addTo(map);
      markers.current.push(marker);
      bounds.extend([position.lng, position.lat]);
      hasMarkers = true;
    });

    if (!hasMarkers) {
      const fallback = myLocation || { lat: 32.4927, lng: 74.5319 };
      map.setCenter([fallback.lng, fallback.lat]);
      map.setZoom(14);
      return;
    }

    if (myLocation && expertLocations.length === 0) {
      map.setCenter([myLocation.lng, myLocation.lat]);
      map.setZoom(16);
      return;
    }

    map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 600 });
  }, [accountLat, accountLng, currentLocation, experts, ready]);

  return (
    <div className="relative h-[280px] overflow-hidden rounded-2xl border border-line bg-[#dfe9e2] sm:h-[340px]">
      <div ref={mapElement} className="h-full w-full" />
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#efe8d8] p-5 text-center text-sm">
          {mapError}
        </div>
      ) : null}
    </div>
  );
}
