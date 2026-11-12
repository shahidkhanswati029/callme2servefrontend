"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";
import { locationApi } from "@/modules/location/api";
import { currencyForCountry } from "@/shared/countries";
import { getAccessToken } from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** On first expert login with no pin, capture GPS and save place once. Also attach QR referral. */
export function AutoPlaceOnLogin() {
  const account = useAppSelector((s) => s.session.account);
  const hydrated = useAppSelector((s) => s.session.hydrated);
  const dispatch = useAppDispatch();
  const placeRan = useRef(false);
  const refRan = useRef(false);

  useEffect(() => {
    if (!hydrated || !account || account.seat !== "EXPERT") return;

    if (!account.referredById && !refRan.current) {
      const code = sessionStorage.getItem("cmts_ref");
      if (code) {
        refRan.current = true;
        void (async () => {
          try {
            const token = getAccessToken();
            const res = await fetch(`${API_URL}/api/referrer/attach`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ code }),
            });
            const json = await res.json();
            if (res.ok && json.data?.account) {
              dispatch(setAccount(json.data.account));
              sessionStorage.removeItem("cmts_ref");
            }
          } catch {
            // ignore
          }
        })();
      }
    }

    if (account.latitude != null && account.longitude != null) return;
    if (placeRan.current) return;
    if (!navigator.geolocation) return;
    placeRan.current = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const country = account.country || "PK";
          const res = await locationApi.save({
            placeLabel:
              account.placeLabel ||
              account.city ||
              `Standing here · ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
            city: account.city || undefined,
            country,
            currency: account.currency || currencyForCountry(country),
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyM: Math.round(pos.coords.accuracy || 25),
          });
          dispatch(setAccount(res.data.account));
        } catch {
          // User can still set place manually in Settings.
        }
      },
      () => {
        // Permission denied — place settings remain available.
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }, [hydrated, account, dispatch]);

  return null;
}
