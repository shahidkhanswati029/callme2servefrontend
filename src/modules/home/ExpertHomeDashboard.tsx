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
import { BarChart, DonutChart } from "@/shared/ui/MiniCharts";
import { countryLabel, t, tDynamic, tExpertCard } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";
import { Reveal } from "@/shared/ui/Reveal";

const NearbyMap = dynamic(
  () => import("./NearbyMap").then((m) => m.NearbyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-line bg-[#dfe9e2] text-sm text-muted sm:h-[340px]">
        …
      </div>
    ),
  },
);

const CATEGORIES = [
  { id: "All", key: "catAll" },
  { id: "Surgical", key: "catSurgical" },
  { id: "Leather", key: "catLeather" },
  { id: "Tutor", key: "catTutor" },
  { id: "Institute", key: "catInstitute" },
  { id: "Factory", key: "catFactory" },
  { id: "Tailor", key: "catTailor" },
  { id: "Other", key: "catOther" },
] as const;

const packageLabelKey: Record<string, string> = {
  FREE: "packageFree",
  SILVER: "packageSilver",
  GOLD: "packageGold",
  PLATINUM: "packagePlatinum",
};

const packageRadiusKm: Record<string, number> = {
  FREE: 5,
  SILVER: 12,
  GOLD: 21,
  PLATINUM: 33,
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
  const lang = useUiLanguage();
  const toast = useToast();

  const [experts, setExperts] = useState<NearbyExpert[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [focusExpertId, setFocusExpertId] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [unread, setUnread] = useState(0);
  const [jobStats, setJobStats] = useState({
    open: 0,
    booked: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    earned: 0,
  });
  const [radiusKm, setRadiusKm] = useState(packageRadiusKm[account.package] || 5);
  const [inquiriesLabel, setInquiriesLabel] = useState("Unlimited");

  const loadNearby = useCallback(
    async (searchQ?: string, origin?: Coordinates | null) => {
      setLoadingNearby(true);
      try {
        const from = origin ?? currentLocation;
        const res = await locationApi.nearby(undefined, {
          category: category === "All" ? undefined : category,
          q: (searchQ ?? query).trim() || undefined,
          latitude: from?.lat,
          longitude: from?.lng,
        });
        setExperts(res.data.experts || []);
        if (res.data.radiusKm) setRadiusKm(res.data.radiusKm);
        setInquiriesLabel(t(lang, "unlimited"));
      } catch (err) {
        setExperts([]);
        toast.info(err instanceof Error ? err.message : t(lang, "setPlaceFirst"));
      } finally {
        setLoadingNearby(false);
      }
    },
    [category, query, toast, lang, currentLocation],
  );

  // Category / live GPS origin changes refetch; typing does not until Search.
  useEffect(() => {
    void loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: category + GPS
  }, [category, currentLocation?.lat, currentLocation?.lng]);

  useEffect(() => {
    let cancelled = false;
    void jobsApi
      .list(1, 50)
      .then((res) => {
        if (cancelled) return;
        const jobs = res.data.jobs || [];
        const next = {
          open: 0,
          booked: 0,
          accepted: 0,
          completed: 0,
          cancelled: 0,
          earned: 0,
        };
        for (const j of jobs) {
          if (j.status === "OPEN") next.open += 1;
          else if (j.status === "BOOKED") next.booked += 1;
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
      setLocationMessage(t(lang, "geoUnsupported"));
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
          setLocationMessage(t(lang, "geoPermissionDenied"));
        } else {
          setLocationMessage(t(lang, "geoUnavailable"));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    void notificationsApi
      .list(1, 1)
      .then((list) => {
        if (!cancelled) setUnread(list.data.unread || 0);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const accountWithCoords = account as typeof account & {
    latitude?: number | null;
    longitude?: number | null;
  };

  return (
    <AppShell>
      <header className="animate-rise mb-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
          {(
            account.city ||
            countryLabel(lang, displayCountry) ||
            t(lang, "city")
          ).toUpperCase()}{" "}
          · {t(lang, "today")}
        </p>
        <h2 className="font-display mt-1 text-2xl font-bold">{account.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {t(lang, packageLabelKey[account.package] || "packageFree")} · {t(lang, "radius")}{" "}
          {radiusKm} km · {t(lang, "inquiries")} {inquiriesLabel}
          {unread ? ` · ${unread} ${t(lang, "notifications")}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/quotations"
            className="cmts-press rounded-xl bg-forest px-3 py-2 text-xs font-semibold text-paper"
          >
            {t(lang, "quotations")}
          </Link>
          <Link
            href="/portfolio"
            className="cmts-press rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
          >
            {t(lang, "portfolio")}
          </Link>
          <Link
            href="/refer"
            className="cmts-press rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
          >
            {t(lang, "refer")}
          </Link>
          <Link
            href="/earnings"
            className="cmts-press rounded-xl border border-line bg-paper px-3 py-2 text-xs font-semibold"
          >
            {t(lang, "earnings")}
          </Link>
        </div>
      </header>

      <Reveal>
        <ProfileCompletionBar account={account} />
      </Reveal>

      <section className="mb-4 grid gap-4 lg:grid-cols-2">
        <Reveal delay={40}>
          <div className="cmts-card rounded-2xl border border-line bg-cream p-4">
            <h3 className="font-display text-lg font-bold">{t(lang, "yourJobs")}</h3>
            <div className="mt-3">
              <BarChart
                height={140}
                points={[
                  { label: t(lang, "statusOpen"), value: jobStats.open },
                  { label: t(lang, "statusBooked"), value: jobStats.booked },
                  { label: t(lang, "statusAccepted"), value: jobStats.accepted },
                  { label: t(lang, "statusCompleted"), value: jobStats.completed },
                  { label: t(lang, "statusCancelled"), value: jobStats.cancelled },
                ]}
              />
            </div>
          </div>
        </Reveal>
        <Reveal delay={90} variant="scale">
          <div className="cmts-card rounded-2xl border border-line bg-cream p-4">
            <h3 className="font-display text-lg font-bold">{t(lang, "activityMix")}</h3>
            <div className="mt-3">
              <DonutChart
                size={140}
                centerLabel={`${jobStats.earned || 0}`}
                slices={[
                  { label: t(lang, "statusOpen"), value: jobStats.open || 0, color: "var(--brass)" },
                  {
                    label: t(lang, "statusAccepted"),
                    value: jobStats.accepted || 0,
                    color: "var(--forest)",
                  },
                  {
                    label: t(lang, "statusCompleted"),
                    value: jobStats.completed || 0,
                    color: "var(--success)",
                  },
                  {
                    label: t(lang, "statusCancelled"),
                    value: jobStats.cancelled || 0,
                    color: "var(--line)",
                  },
                ]}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              {t(lang, "earnings")}: {displayCurrency} {jobStats.earned.toLocaleString()}
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="rounded-xl border border-line bg-cream px-3 py-2.5 text-sm"
          placeholder={t(lang, "searchExperts")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void loadNearby()}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-paper"
        >
          {t(lang, "search")}
        </button>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`cmts-pill rounded-lg px-3 py-1.5 text-xs font-semibold ${
              category === c.id ? "bg-forest text-paper" : "border border-line bg-cream text-ink"
            }`}
          >
            {t(lang, c.key)}
          </button>
        ))}
      </div>

      <section className="animate-rise mb-4" data-nearby-map>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-display text-xl font-bold">{t(lang, "nearbyMap")}</h3>
          <span className="text-xs text-muted">
            {t(lang, "withinKm")} {radiusKm} km ·{" "}
            {t(lang, packageLabelKey[account.package] || "packageFree")}
          </span>
        </div>
        <NearbyMap
          accountLat={accountWithCoords.latitude}
          accountLng={accountWithCoords.longitude}
          currentLocation={currentLocation}
          experts={experts}
          focusExpertId={focusExpertId}
        />
        {locationMessage ? (
          <p className="mt-2 rounded-lg bg-cream p-3 text-xs text-muted">{locationMessage}</p>
        ) : null}
      </section>

      <section className="mb-4 grid gap-2 sm:grid-cols-3">
        <Reveal delay={30}>
          <Link href="/settings/place" className="cmts-card block rounded-xl border border-line bg-cream p-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
              {t(lang, "place")}
            </p>
            <strong className="mt-1 block text-sm">
              {account.placeLabel || account.city || t(lang, "setYourPin")}
            </strong>
          </Link>
        </Reveal>
        <Reveal delay={70}>
          <div className="cmts-card rounded-xl border border-line bg-cream p-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
              {t(lang, "currencyLabel")}
            </p>
            <strong className="mt-1 block text-sm">
              {countryLabel(lang, displayCountry)} · {displayCurrency}
            </strong>
          </div>
        </Reveal>
        <Reveal delay={110}>
          <Link href="/shops" className="cmts-card block rounded-xl border border-line bg-cream p-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brass-deep">
              {t(lang, "shop")}
            </p>
            <strong className="mt-1 block text-sm">{t(lang, "openOrManageShop")}</strong>
          </Link>
        </Reveal>
      </section>

      <section className="grid gap-2">
        <h3 className="animate-rise font-display text-xl font-bold">{t(lang, "nearbyExperts")}</h3>
        {loadingNearby ? (
          <Loader label={t(lang, "findingExperts")} />
        ) : experts.length === 0 ? (
          <p className="rounded-xl border border-line bg-cream p-4 text-sm text-muted">
            {t(lang, "noExpertsInRadius")}
          </p>
        ) : (
          experts.map((n, i) => {
            const top =
              Number(n.rating || 0) >= 4.5 && Number((n as { ratingCount?: number }).ratingCount || 0) >= 3;
            return (
            <Reveal key={n.id} delay={Math.min(i * 45, 240)}>
            <div
              className={`cmts-card flex items-center justify-between gap-3 rounded-xl border bg-cream px-4 py-3 ${
                top ? "border-brass shadow-[0_6px_18px_rgba(224,154,43,0.18)]" : "border-line"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong>{n.name}</strong>
                  {top ? (
                    <span className="rounded-md bg-brass px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-forest">
                      {t(lang, "topRanked")}
                    </span>
                  ) : null}
                  <span
                    className={`h-2 w-2 rounded-full ${n.isOnline ? "animate-pulse-dot bg-success" : "bg-line"}`}
                    title={n.isOnline ? t(lang, "online") : t(lang, "offline")}
                  />
                </div>
                <span className="text-sm text-muted">
                  {tExpertCard(lang, n)} · {n.distanceKm} km
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <em className="not-italic font-bold text-brass-deep">
                  ★ {Number(n.rating || 0).toFixed(1)}
                </em>
                <div className="flex flex-wrap justify-end gap-1">
                  <button
                    type="button"
                    className="cmts-press cursor-pointer rounded-lg border border-line bg-paper px-3 py-1 text-xs font-semibold text-forest hover:cursor-pointer hover:border-forest"
                    onClick={() => {
                      setFocusExpertId(n.id);
                      try {
                        document
                          .querySelector("[data-nearby-map]")
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    {t(lang, "directions")}
                  </button>
                  <Link
                    href={`/inbox/${n.id}`}
                    className="cmts-press cursor-pointer rounded-lg bg-forest px-3 py-1 text-xs font-semibold text-paper hover:cursor-pointer"
                  >
                    {t(lang, "message")}
                  </Link>
                  <Link
                    href={`/jobs?worker=${n.id}`}
                    className="cursor-pointer rounded-lg border border-line bg-cream px-3 py-1 text-xs font-semibold text-forest hover:cursor-pointer hover:border-forest"
                  >
                    {t(lang, "askJob")}
                  </Link>
                </div>
              </div>
            </div>
            </Reveal>
            );
          })
        )}
      </section>
    </AppShell>
  );
}
