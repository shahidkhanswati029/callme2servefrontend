"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { uploadMedia } from "@/modules/chat/api";
import { portfolioApi } from "@/modules/portfolio/api";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader, Loader } from "@/shared/ui/Loader";
import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

export default function PortfolioPage() {
  return (
    <RequireAuth seat="EXPERT">
      <Inner />
    </RequireAuth>
  );
}

function Inner() {
  const toast = useToast();
  const lang = useUiLanguage();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"cert" | "item" | null>(null);
  const [certTitle, setCertTitle] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [data, setData] = useState<{
    certificates: Array<{
      id: string;
      title: string;
      issuer: string | null;
      fileUrl: string;
      verified: boolean;
    }>;
    portfolioItems: Array<{ id: string; title: string; mediaUrl: string; kind: string }>;
    readyToBid: boolean;
  } | null>(null);
  const certFileRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);
  /** Blocks ghost-clicks that fire on the portfolio button after the cert file dialog closes. */
  const blockPickerUntil = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await portfolioApi.mine();
      setData(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [lang, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addCert(file: File) {
    if (!certTitle.trim()) {
      toast.error(t(lang, "titleRequired"));
      return;
    }
    setBusy("cert");
    try {
      const uploaded = await uploadMedia(file, "IMAGE");
      await portfolioApi.addCertificate({
        title: certTitle.trim(),
        issuer: certIssuer.trim() || undefined,
        fileUrl: uploaded.url,
      });
      setCertTitle("");
      setCertIssuer("");
      toast.success(t(lang, "certificateAdded"));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "uploadFailed"));
    } finally {
      setBusy(null);
      if (certFileRef.current) certFileRef.current.value = "";
    }
  }

  async function addItem(file: File) {
    if (!itemTitle.trim()) {
      toast.error(t(lang, "titleRequired"));
      return;
    }
    setBusy("item");
    try {
      const isVideo = file.type.startsWith("video/");
      const uploaded = await uploadMedia(file, isVideo ? "VIDEO" : "IMAGE");
      await portfolioApi.addItem({
        title: itemTitle.trim(),
        mediaUrl: uploaded.url,
        kind: isVideo ? "VIDEO" : "IMAGE",
      });
      setItemTitle("");
      toast.success(t(lang, "portfolioAdded"));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(lang, "uploadFailed"));
    } finally {
      setBusy(null);
      if (itemFileRef.current) itemFileRef.current.value = "";
    }
  }

  function openCertPicker() {
    blockPickerUntil.current = Date.now() + 1200;
    certFileRef.current?.click();
  }

  function openItemPicker() {
    if (Date.now() < blockPickerUntil.current) return;
    blockPickerUntil.current = Date.now() + 1200;
    itemFileRef.current?.click();
  }

  if (loading || !data) {
    return (
      <AppShell title={t(lang, "portfolio")}>
        <Loader />
      </AppShell>
    );
  }

  return (
    <AppShell title={t(lang, "portfolio")}>
      <div className="mx-auto max-w-3xl space-y-6 p-4">
        <p className="text-sm text-muted">{t(lang, "portfolioLede")}</p>
        <p className="rounded-xl bg-mint px-3 py-2 text-sm font-semibold text-forest">
          {data.readyToBid ? t(lang, "readyToBid") : t(lang, "uploadToBid")}
        </p>

        <section className="space-y-3 rounded-2xl border border-line bg-paper p-4">
          <h2 className="font-bold">{t(lang, "certificates")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded-xl border border-line px-3 py-2 text-sm"
              placeholder={t(lang, "titleRequired")}
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
            />
            <input
              className="rounded-xl border border-line px-3 py-2 text-sm"
              placeholder={t(lang, "issuerOptional")}
              value={certIssuer}
              onChange={(e) => setCertIssuer(e.target.value)}
            />
          </div>
          <input
            ref={certFileRef}
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              blockPickerUntil.current = Date.now() + 1200;
              if (f) void addCert(f);
            }}
          />
          <button
            type="button"
            disabled={busy != null}
            onClick={openCertPicker}
            className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {busy === "cert" ? <ButtonLoader /> : t(lang, "uploadCertificate")}
          </button>
          <ul className="space-y-2">
            {data.certificates.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-sm"
              >
                <a href={c.fileUrl} target="_blank" rel="noreferrer" className="font-semibold underline">
                  {c.title}
                  {c.issuer ? ` · ${c.issuer}` : ""}
                </a>
                <button
                  type="button"
                  className="text-xs text-muted"
                  onClick={() =>
                    void portfolioApi.removeCertificate(c.id).then(load).catch((err) =>
                      toast.error(err instanceof Error ? err.message : t(lang, "actionFailed")),
                    )
                  }
                >
                  {t(lang, "remove")}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-paper p-4">
          <h2 className="font-bold">{t(lang, "portfolioItems")}</h2>
          <input
            className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            placeholder={t(lang, "titleRequired")}
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
          />
          <input
            ref={itemFileRef}
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (Date.now() < blockPickerUntil.current && !f) return;
              if (f) void addItem(f);
            }}
          />
          <button
            type="button"
            disabled={busy != null}
            onClick={openItemPicker}
            className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {busy === "item" ? <ButtonLoader /> : t(lang, "uploadPortfolio")}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.portfolioItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-line p-2">
                {item.kind === "VIDEO" ? (
                  <video src={item.mediaUrl} controls className="h-36 w-full rounded-lg object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.mediaUrl} alt={item.title} className="h-36 w-full rounded-lg object-cover" />
                )}
                <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold">{item.title}</span>
                  <button
                    type="button"
                    className="text-xs text-muted"
                    onClick={() =>
                      void portfolioApi.removeItem(item.id).then(load).catch((err) =>
                        toast.error(err instanceof Error ? err.message : t(lang, "actionFailed")),
                      )
                    }
                  >
                    {t(lang, "remove")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
