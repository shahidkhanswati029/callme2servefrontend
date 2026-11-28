"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { t, tDynamic, type UiLanguage } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

export type SystemErrorKind = "server" | "network" | "notfound" | "generic";

const COPY: Record<
  SystemErrorKind,
  { eyebrowKey: string; titleKey: string; ledeKey: string; code: string }
> = {
  server: {
    eyebrowKey: "serverTrouble",
    titleKey: "errorServerTitle",
    ledeKey: "errorServerLede",
    code: "SERVER",
  },
  network: {
    eyebrowKey: "errorNetworkEyebrow",
    titleKey: "errorNetworkTitle",
    ledeKey: "errorNetworkLede",
    code: "NETWORK",
  },
  notfound: {
    eyebrowKey: "errorNotFoundEyebrow",
    titleKey: "errorNotFoundTitle",
    ledeKey: "errorNotFoundLede",
    code: "404",
  },
  generic: {
    eyebrowKey: "errorGenericEyebrow",
    titleKey: "errorGenericTitle",
    ledeKey: "errorGenericLede",
    code: "ERROR",
  },
};

function localizedCopy(lang: UiLanguage, kind: SystemErrorKind) {
  const row = COPY[kind];
  return {
    eyebrow: t(lang, row.eyebrowKey),
    title: t(lang, row.titleKey),
    lede: t(lang, row.ledeKey),
    code: row.code,
  };
}

type Props = {
  kind?: SystemErrorKind;
  title?: string;
  message?: string;
  digest?: string;
  onRetry?: () => void;
  homeHref?: string;
  actions?: ReactNode;
};

/** Consistent, animated system / server / network error surface. */
export function SystemError({
  kind = "generic",
  title,
  message,
  digest,
  onRetry,
  homeHref = "/",
  actions,
}: Props) {
  const lang = useUiLanguage();
  const copy = localizedCopy(lang, kind);

  return (
    <div className="relative grid min-h-[70vh] place-items-center overflow-hidden bg-paper px-4 py-16 text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50 animate-fade"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(224,154,43,0.18), transparent 60%), radial-gradient(ellipse 40% 35% at 85% 80%, rgba(27,60,51,0.08), transparent 55%)",
        }}
      />

      <div className="relative w-full max-w-lg">
        <div className="animate-scale overflow-hidden rounded-3xl border border-line bg-cream shadow-[0_24px_60px_rgba(26,40,34,0.12)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-forest via-brass to-forest" />
          <div className="p-6 sm:p-8">
            <div className="animate-rise flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest text-paper shadow-[0_10px_28px_rgba(27,60,51,0.28)]">
                <span className="animate-float text-2xl font-bold" aria-hidden>
                  !
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-brass-deep">
                  {copy.eyebrow}
                </p>
                <h1 className="font-display mt-1 text-2xl font-bold leading-tight sm:text-3xl">
                  {title ? tDynamic(lang, title) : copy.title}
                </h1>
              </div>
            </div>

            <p className="animate-rise mt-4 text-sm leading-relaxed text-muted [animation-delay:80ms]">
              {message ? tDynamic(lang, message) : copy.lede}
            </p>

            <div className="animate-rise mt-5 flex flex-wrap items-center gap-2 [animation-delay:120ms]">
              <span className="rounded-lg bg-mint px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-forest">
                {copy.code}
              </span>
              {digest ? (
                <span className="truncate rounded-lg border border-line bg-paper px-2.5 py-1 font-mono text-[0.65rem] text-muted">
                  {digest}
                </span>
              ) : null}
            </div>

            <div className="animate-rise mt-7 flex flex-wrap gap-3 [animation-delay:160ms]">
              {onRetry ? (
                <button
                  type="button"
                  onClick={onRetry}
                  className="cmts-press rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-paper"
                >
                  {t(lang, "tryAgain")}
                </button>
              ) : null}
              <Link
                href={homeHref}
                className="cmts-press rounded-xl border border-line bg-paper px-5 py-3 text-sm font-semibold text-ink"
              >
                {t(lang, "backToHome")}
              </Link>
              {actions}
            </div>
          </div>
        </div>

        <p className="animate-fade mt-5 text-center text-xs text-muted [animation-delay:220ms]">
          {tDynamic(lang, "CallMe2Serve · if this keeps happening, contact support")}
        </p>
      </div>
    </div>
  );
}