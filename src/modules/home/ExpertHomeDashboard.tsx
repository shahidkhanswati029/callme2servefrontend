"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ProfileCompletionBar } from "./ProfileCompletionBar";
import { useAppSelector } from "@/store/hooks";
import { Loader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { locationApi, type NearbyExpert } from "@/modules/location/api";
import { jobsApi } from "@/modules/jobs/api";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { notificationsApi } from "@/modules/notifications/api";
import { registerPushToken, listenForegroundPush } from "@/lib/firebase";
import { BarChart, DonutChart } from "@/shared/ui/MiniCharts";

const NearbyMap = dynamic(
  () => import("./NearbyMap").then((m) => m.NearbyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-line bg-[#dfe9e2] text-sm text-muted sm:h-[340px]">
        Loading map…
      </div>
    ),
  },
);

const CATEGORIES = [
  "All",
  "Surgical",
  "Leather",
  "Tutor",
  "Institute",
  "Factory",
  "Tailor",
  "Other",
];

const packageRate: Record<string, string> = {
  FREE: "12%",
  SILVER: "9%",
  GOLD: "6%",
  PLATINUM: "2%",
};

type Coordinates = { lat: number; lng: number };

export function ExpertHomeDashboard() {
  return (
    <RequireAuth seat="EXPERT">
      <HomeInner />
    </RequireAuth>
  );
}

function HomeInner() {
  const account = useAppSelector((s) => s.session.account)!;
  const prefsCountry = useAppSelector((s) => s.uiPrefs.countryCode);
  const prefsCurrency = useAppSelector((s) => s.uiPrefs.currency);
  const displayCountry = prefsCountry || account.country;
  const displayCurrency = prefsCurrency || account.currency;
  const toast = useToast();

  const [experts, setExperts] = useState<NearbyExpert[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [unread, setUnread] = useState(0);
  const [jobStats, setJobStats] = useState({
    open: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    earned: 0,
  });

  const loadNearby = useCallback(
    async (searchQ?: string) => {
      setLoadingNearby(true);
      try {
        const res = await locationApi.nearby(5, {
          category: category === "All" ? undefined : category,
          q: (searchQ ?? query).trim() || undefined,
        });
        setExperts(res.data.experts || []);
      } catch (err) {
        setExperts([]);
        toast.info(err instanceof Error ? err.message : "Set your place to see nearby experts");
      } finally {
        setLoadingNearby(false);
      }
    },
    [category, query, toast],
  );

  // Category changes refetch; typing does not until Search (performance).
  useEffect(() => {
    void loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: category only
  }, [category]);

  useEffect(() => {
    let cancelled = false;
    void jobsApi
      .list(1, 50)
      .then((res) => {
        if (cancelled) return;
        const jobs = res.data.jobs || [];
        const next = { open: 0, accepted: 0, completed: 0, cancelled: 0, earned: 0 };
        for (const j of jobs) {
          if (j.status === "OPEN") next.open += 1;
          else if (j.status === "ACCEPTED") next.accepted += 1;
          else if (j.status === "COMPLETED") {
            next.completed += 1;
            if (j.workerId === account.id) next.earned += j.netToWorker;
          } else if (j.status === "CANCELLED") next.cancelled += 1;
        }
        setJobStats(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account.id]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationMessage("Your browser does not support location services.");
      return;
    }
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationMessage("");
      },
      (error) => {
        if (cancelled) return;
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage(
            "Location permission denied. Allow location to show your exact position.",
          );
        } else {
          setLocationMessage("Unable to get GPS. Showing saved place if available.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    const run = async () => {
      try {
        const list = await notificationsApi.list(1, 1);
        if (!cancelled) setUnread(list.data.unread || 0);
      } catch {
        // optional
      }
      // Defer Firebase — it is heavy and optional; sockets cover in-app alerts.
      await new Promise((r) => setTimeout(r, 2500));
      if (cancelled) return;
      try {
        const token = await registerPushToken();
        if (token) await notificationsApi.savePushToken(token);
        unsub = (await listenForegroundPush((title, body) => {
          toast.info(`${title}: ${body}`);
        })) as (() => void) | undefined;
      } catch {
        // optional
      }
    };
    void run();
    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, [toast]);

  const rate = packageRate[account.package] || "12%";
  const accountWithCoords = account as typeof account & {
    latitude?: number | null;
    longitude?: number | null;
  };

  return (
    <AppShell>
      <header className="mb-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
          {(account.city || "Sialkot").toUpperCase()} · TODAY
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold">Physics, forceps, jackets</h2>
        <p className="mt-1 text-sm text-muted">
          {account.package} · commission {rate}
          {unread ? ` · ${unread} notifications` : ""}
        </p>
      </header>

      <ProfileCompletionBar account={account} />

      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-lg font-bold">Your jobs</h3>
          <div className="mt-3">
            <BarChart
              height={140}
              points={[
                { label: "Open", value: jobStats.open },
                { label: "Accepted", value: jobStats.accepted },
                { label: "Done", value: jobStats.completed },
                { label: "Cancel", value: jobStats.cancelled },
              ]}
            />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-cream p-4">
          <h3 className="font-display text-lg font-bold">Activity mix</h3>
          <div className="mt-3">
            <DonutChart
              size={140}
              centerLabel={`${jobStats.earned || 0}`}
              slices={[
                { label: "Open", value: jobStats.open || 0, color: "var(--brass)" },
                { label: "Accepted", value: jobStats.accepted || 0, color: "var(--forest)" },
                { label: "Completed", value: jobStats.completed || 0, color: "var(--success)" },
                { label: "Cancelled", value: jobStats.cancelled || 0, color: "var(--line)" },
              ]}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Net earned on completed jobs as worker: {displayCurrency}{" "}
            {jobStats.earned.toLocaleString()} · real GPS for nearby map below
          </p>
        </div>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="rounded-xl border border-line bg-cream px-3 py-2.5 text-sm"
          placeholder="Search experts near me…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void loadNearby()}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-paper"
        >
          Search
        </button>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              category === c ? "bg-forest text-paper" : "border border-line bg-cream text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="animate-rise mb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-bold">Nearby map</h3>
          <span className="text-xs text-muted">Within 5 km · Mapbox</span>
        </div>
        <NearbyMap
          accountLat={accountWithCoords.latitude}
          accountLng={accountWithCoords.longitude}
          currentLocation={currentLocation}
          experts={experts}
        />
        {locationMessage ? (
          <p className="mt-2 rounded-lg bg-cream p-3 text-xs text-muted">{locationMessage}</p>
        ) : null}
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-3">
        <Link href="/settings/place" className="rounded-xl border border-line bg-cream p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
            Place
          </p>
          <strong className="mt-1 block text-sm">
            {account.placeLabel || account.city || "Set your pin"}
          </strong>
        </Link>
        <div className="rounded-xl border border-line bg-cream p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
            Currency
          </p>
          <strong className="mt-1 block text-sm">
            {displayCountry} · {displayCurrency}
          </strong>
        </div>
        <Link href="/shops" className="rounded-xl border border-line bg-cream p-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
            Shop
          </p>
          <strong className="mt-1 block text-sm">Open or manage shop</strong>
        </Link>
      </section>

      <section className="grid gap-2">
        <h3 className="font-display text-xl font-bold">Nearby experts</h3>
        {loadingNearby ? (
          <Loader label="Finding experts near you…" />
        ) : experts.length === 0 ? (
          <p className="rounded-xl border border-line bg-cream p-4 text-sm text-muted">
            No experts match this search inside 5 km. Save your place pin first.
          </p>
        ) : (
          experts.map((n) => {
            const top =
              Number(n.rating || 0) >= 4.5 && Number((n as { ratingCount?: number }).ratingCount || 0) >= 3;
            return (
            <div
              key={n.id}
              className={`flex items-center justify-between gap-3 rounded-xl border bg-cream px-4 py-3 ${
                top ? "border-brass shadow-[0_6px_18px_rgba(224,154,43,0.18)]" : "border-line"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong>{n.name}</strong>
                  {top ? (
                    <span className="rounded-md bg-brass px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-forest">
                      Top
                    </span>
                  ) : null}
                  <span
                    className={`h-2 w-2 rounded-full ${n.isOnline ? "bg-success" : "bg-line"}`}
                    title={n.isOnline ? "Online" : "Offline"}
                  />
                </div>
                <span className="text-sm text-muted">
                  {n.placeLabel || n.city || "—"} · {n.work || "Expert"} · {n.distanceKm} km
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <em className="not-italic font-bold text-brass-deep">
                  ★ {Number(n.rating || 0).toFixed(1)}
                </em>
                <div className="flex gap-1">
                  <Link
                    href={`/inbox/${n.id}`}
                    className="rounded-lg bg-forest px-3 py-1 text-xs font-semibold text-paper"
                  >
                    Message
                  </Link>
                  <Link
                    href={`/jobs?worker=${n.id}`}
                    className="rounded-lg border border-line bg-cream px-3 py-1 text-xs font-semibold text-forest"
                  >
                    Ask job
                  </Link>
                </div>
              </div>
            </div>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
