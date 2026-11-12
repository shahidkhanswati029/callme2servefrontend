"use client";

import { useEffect, useState } from "react";
import { downloadMedia, mediaFilename } from "@/shared/media/downloadMedia";

type Props = {
  kind: "IMAGE" | "VIDEO";
  url: string;
  onClose: () => void;
};

export function MediaLightbox({ kind, url, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadMedia(url, mediaFilename(kind, url));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={kind === "IMAGE" ? "Image preview" : "Video preview"}
    >
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 text-white">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-white/10"
          aria-label="Close"
        >
          ✕ Close
        </button>
        <button
          type="button"
          disabled={downloading}
          onClick={() => void handleDownload()}
          className="rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold hover:bg-white/25 disabled:opacity-50"
        >
          {downloading ? "Downloading…" : "Download"}
        </button>
      </div>

      <button
        type="button"
        className="absolute inset-0 z-0 cursor-default"
        aria-label="Dismiss preview"
        onClick={onClose}
      />

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 pb-6">
        {kind === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Full preview"
            className="max-h-full max-w-full object-contain select-none"
            draggable={false}
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            playsInline
            className="max-h-full max-w-full rounded-lg bg-black"
          />
        )}
      </div>
    </div>
  );
}

type ThumbProps = {
  kind: "IMAGE" | "VIDEO";
  url: string;
  mine?: boolean;
  onOpen: () => void;
  onDownload: () => void;
};

/** Compact WhatsApp-style bubble media with tap-to-preview. */
export function ChatMediaThumb({ kind, url, mine, onOpen, onDownload }: ThumbProps) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-zoom-in text-left"
        aria-label={kind === "IMAGE" ? "Open image" : "Open video"}
      >
        {kind === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-56 w-full object-cover" />
        ) : (
          <div className="relative">
            <video
              src={url}
              muted
              playsInline
              preload="metadata"
              className="max-h-56 w-full object-cover"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-xl text-white">
                ▶
              </span>
            </span>
          </div>
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDownload();
        }}
        className={`absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-[0.65rem] font-bold shadow ${
          mine ? "bg-black/45 text-white" : "bg-black/55 text-white"
        }`}
        aria-label="Download"
        title="Download"
      >
        ↓ Save
      </button>
    </div>
  );
}
