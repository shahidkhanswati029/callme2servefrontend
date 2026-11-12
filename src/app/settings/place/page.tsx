"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { locationApi } from "@/modules/location/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";
import { setCountry } from "@/store/slices/uiPrefsSlice";
import { useToast } from "@/shared/toast/ToastProvider";
import { useConfirm } from "@/shared/confirm/ConfirmProvider";
import { ButtonLoader } from "@/shared/ui/Loader";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { identityApi } from "@/modules/identity/api";
import { sessionCookies } from "@/shared/cookies";
import { listCountries, currencyForCountry } from "@/shared/countries";

export default function PlaceSettingsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <PlaceInner />
    </RequireAuth>
  );
}

function PlaceInner() {
  const account = useAppSelector((s) => s.session.account)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const { confirm } = useConfirm();
  const countries = useMemo(() => listCountries(), []);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [draft, setDraft] = useState({
    label: account.placeLabel || "",
    city: account.city || "",
    country: account.country || "PK",
    currency: account.currency || "PKR",
    latitude: 32.4945,
    longitude: 74.5229,
    accuracyM: 15,
  });

  useEffect(() => {
    setDraft((d) => ({
      ...d,
      label: account.placeLabel || d.label,
      city: account.city || d.city,
      country: account.country || d.country,
      currency: account.currency || d.currency,
    }));
  }, [account]);

  function useGps() {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((d) => ({
          ...d,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: Math.round(pos.coords.accuracy || 15),
          label:
            d.label ||
            `Standing here · ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }));
        toast.success("GPS pin captured from where you are standing");
        setLocating(false);
      },
      () => {
        toast.error("Could not read GPS. Allow location permission.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!draft.label.trim()) {
      toast.error("Add a place name");
      return;
    }
    const ok = await confirm({
      title: "Update place",
      message: `Save “${draft.label.trim()}” as your place pin on the map?`,
      confirmLabel: "Save place",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setBusy(true);
    try {
      // Ensure we have a fresh access token before saving (fixes "Missing access token").
      if (!sessionCookies.getAccessToken()) {
        const refreshed = await identityApi.refresh();
        if (refreshed.data?.accessToken) {
          sessionCookies.saveAccessToken(refreshed.data.accessToken);
        }
      }
      const res = await locationApi.save({
        placeLabel: draft.label.trim(),
        city: draft.city.trim() || undefined,
        country: draft.country,
        currency: draft.currency,
        latitude: draft.latitude,
        longitude: draft.longitude,
        accuracyM: draft.accuracyM,
      });
      dispatch(setAccount(res.data.account));
      dispatch(setCountry(draft.country));
      toast.success(res.message || "Place saved");
      router.push("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save place");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Place">
      <p className="mb-4 text-sm text-muted">
        On the map now:{" "}
        <strong className="text-ink">{account.placeLabel || "Not set"}</strong>. Saving does
        not move your shop pin. Rating travels with you.
      </p>

      <form className="grid gap-3" onSubmit={onSave}>
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className="rounded-xl border border-line bg-cream px-4 py-3 text-left font-semibold disabled:opacity-50"
        >
          {locating ? (
            <span className="flex items-center gap-2">
              <ButtonLoader dark /> Reading GPS…
            </span>
          ) : (
            "Use where I am standing (GPS)"
          )}
        </button>

        <label className="grid gap-1 text-sm font-semibold">
          Place name
          <input
            className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Ugoki Road, Sialkot"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          City
          <input
            className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
            value={draft.city}
            onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
            placeholder="Sialkot"
          />
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          Country (sets currency via iso-countries)
          <select
            className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
            value={draft.country}
            onChange={(e) => {
              const code = e.target.value;
              setDraft((d) => ({
                ...d,
                country: code,
                currency: currencyForCountry(code),
              }));
            }}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} · {c.currency}
              </option>
            ))}
          </select>
        </label>

        <p className="rounded-xl border border-line bg-mint px-3 py-2 text-sm text-forest">
          Pin {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)} · ±
          {draft.accuracyM}m · Currency {draft.currency} · Your rating{" "}
          {Number(account.rating || 0).toFixed(1)}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 rounded-xl bg-forest px-4 py-3 font-semibold text-paper disabled:opacity-50"
        >
          {busy ? <ButtonLoader /> : "Save this place"}
        </button>
      </form>
    </AppShell>
  );
}
