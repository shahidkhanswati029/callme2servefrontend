"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { uploadMedia } from "@/modules/chat/api";
import { quotationsApi, type QuotationRequest } from "@/modules/quotations/api";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader, Loader } from "@/shared/ui/Loader";
import { t, tDynamic } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

const CATEGORIES = [
  { id: "Surgical", key: "catSurgical" },
  { id: "Leather", key: "catLeather" },
  { id: "Tutor", key: "catTutor" },
  { id: "Institute", key: "catInstitute" },
  { id: "Factory", key: "catFactory" },
  { id: "Tailor", key: "catTailor" },
  { id: "Electrician", key: "catElectrician" },
  { id: "Plumber", key: "catPlumber" },
  { id: "Other", key: "catOther" },
] as const;

export default function QuotationsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const lang = useUiLanguage();
  const [tab, setTab] = useState<"nearby" | "mine" | "post">("nearby");
  const [nearby, setNearby] = useState<QuotationRequest[]>([]);
  const [mine, setMine] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDurationS, setVideoDurationS] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [n, m] = await Promise.all([quotationsApi.nearby(), quotationsApi.mine()]);
      setNearby(n.data.quotations || []);
      setMine(m.data.quotations || []);
    } catch (err) {
      toast.info(err instanceof Error ? err.message : t(lang, "setPlaceFirst"));
    } finally {
      setLoading(false);
    }
  }, [lang, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file: File) {
    setBusy(true);
    try {
      const uploaded = await uploadMedia(file, "VIDEO", { purpose: "QUOTATION" });
      setVideoUrl(uploaded.url);
      setVideoDurationS(Number(uploaded.durationS || 0));
      toast.success(t(lang, "videoReady"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "uploadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function onPost(e: FormEvent) {
    e.preventDefault();
    if (!videoUrl) {
      toast.error(t(lang, "quotationVideoRequired"));
      return;
    }
    setBusy(true);
    try {
      const res = await quotationsApi.create({
        category,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        videoUrl,
        videoDurationS,
      });
      toast.success(
        `${t(lang, "quotationPosted")} · ${res.data.notified} ${t(lang, "expertsNotified")}`,
      );
      setTitle("");
      setNotes("");
      setVideoUrl("");
      setVideoDurationS(0);
      setTab("mine");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "postFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={t(lang, "quotations")}>
      <div className="mx-auto max-w-3xl space-y-4 p-4">
        <p className="text-sm text-muted">
          {t(lang, "quotationsLede")} · {t(lang, "inquiries")}:{" "}
          <span className="font-semibold text-forest">{t(lang, "unlimited")}</span>
        </p>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["nearby", t(lang, "nearbyQuotations")],
              ["mine", t(lang, "myQuotations")],
              ["post", t(lang, "postQuotation")],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                tab === key ? "bg-forest text-paper" : "border border-line bg-paper"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "post" ? (
          <form onSubmit={onPost} className="space-y-3 rounded-2xl border border-line bg-paper p-4">
            <label className="block text-sm font-semibold">
              {t(lang, "category")}
              <select
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(lang, c.key)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              {t(lang, "titleOptional")}
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block text-sm font-semibold">
              {t(lang, "notesOptional")}
              <textarea
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onUpload(f);
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="rounded-xl border border-line bg-cream px-3 py-2 text-sm font-semibold"
              >
                {busy ? <ButtonLoader /> : t(lang, "uploadQuotationVideo")}
              </button>
              <p className="mt-1 text-xs text-muted">{t(lang, "videoMax50")}</p>
              {videoUrl ? (
                <video src={videoUrl} controls className="mt-2 max-h-56 w-full rounded-xl" />
              ) : null}
            </div>
            <button
              type="submit"
              disabled={busy || !videoUrl}
              className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
            >
              {busy ? <ButtonLoader /> : t(lang, "postQuotation")}
            </button>
          </form>
        ) : loading ? (
          <Loader />
        ) : (
          <div className="space-y-3">
            {(tab === "nearby" ? nearby : mine).length === 0 ? (
              <p className="text-sm text-muted">{t(lang, "noQuotations")}</p>
            ) : (
              (tab === "nearby" ? nearby : mine).map((q) => (
                <Link
                  key={q.id}
                  href={`/quotations/${q.id}`}
                  className="block rounded-2xl border border-line bg-paper p-4 hover:border-forest"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong>{tDynamic(lang, q.category)}</strong>
                    <span className="text-xs font-semibold text-forest">
                      {q.distanceKm != null ? `${q.distanceKm} km` : tDynamic(lang, q.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {q.title || q.notes || q.city || q.country} · {tDynamic(lang, q.status)}
                  </p>
                  {q.myBid ? (
                    <p className="mt-1 text-xs font-semibold">
                      {t(lang, "yourBid")}: {tDynamic(lang, q.myBid.status)}
                    </p>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
