"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  file: File;
  kind: "IMAGE" | "VIDEO";
  onCancel: () => void;
  onReady: (file: File) => void;
};

const FRAME = 280;
const OUT = 720;

async function decodeImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return bmp as ImageBitmap;
    } catch {
      // fall through
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read this image"));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sourceSize(src: CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }) {
  const w =
    "naturalWidth" in src && src.naturalWidth
      ? src.naturalWidth
      : Number(src.width) || 0;
  const h =
    "naturalHeight" in src && src.naturalHeight
      ? src.naturalHeight
      : Number(src.height) || 0;
  return { w, h };
}

/** Preview + crop (images) / confirm (videos) before chat send. */
export function MediaPrepareModal({ file, kind, onCancel, onReady }: Props) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [busy, setBusy] = useState(false);
  const [previewReady, setPreviewReady] = useState(kind !== "IMAGE");
  const [previewError, setPreviewError] = useState("");
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [videoMetaOk, setVideoMetaOk] = useState(false);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const cover =
    natural && natural.w > 0 && natural.h > 0
      ? (() => {
          const scale = Math.max(FRAME / natural.w, FRAME / natural.h) * zoom;
          return { w: natural.w * scale, h: natural.h * scale };
        })()
      : null;

  async function finishImage() {
    setBusy(true);
    setPreviewError("");
    try {
      const src = await decodeImage(file);
      const { w: nw, h: nh } = sourceSize(src);
      if (!nw || !nh) throw new Error("Image has no dimensions");

      // Prefer natural size from preview when decode reports odd SVG/icon sizes.
      const fw = natural?.w && natural.w > 0 ? natural.w : nw;
      const fh = natural?.h && natural.h > 0 ? natural.h : nh;

      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas unavailable");

      const coverScale = Math.max(FRAME / fw, FRAME / fh) * zoom;
      const dispW = fw * coverScale;
      const dispH = fh * coverScale;
      const left = FRAME / 2 - dispW / 2 + offset.x;
      const top = FRAME / 2 - dispH / 2 + offset.y;

      const sx = ((0 - left) / dispW) * fw;
      const sy = ((0 - top) / dispH) * fh;
      const sw = (FRAME / dispW) * fw;
      const sh = (FRAME / dispH) * fh;

      const cropW = Math.max(1, Math.min(fw, sw));
      const cropH = Math.max(1, Math.min(fh, sh));
      const cx = Math.max(0, Math.min(fw - cropW, sx));
      const cy = Math.max(0, Math.min(fh - cropH, sy));

      ctx.fillStyle = "#1a2822";
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, cx, cy, cropW, cropH, 0, 0, OUT, OUT);
      if ("close" in src && typeof src.close === "function") {
        try {
          src.close();
        } catch {
          // ignore
        }
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob || blob.size < 32) throw new Error("Crop produced an empty file");
      onReady(
        new File([blob], file.name.replace(/\.\w+$/, "") + "-crop.jpg", {
          type: "image/jpeg",
        }),
      );
    } catch (err) {
      // Last resort: still allow send of original so chat is not blocked.
      setPreviewError(
        err instanceof Error
          ? `${err.message} — you can still send the original.`
          : "Crop failed — you can still send the original.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(26,40,34,0.72)] p-4"
      role="dialog"
      aria-modal="true"
      aria-label={kind === "IMAGE" ? "Crop image" : "Preview video"}
    >
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-line bg-cream shadow-[0_20px_50px_rgba(26,40,34,0.28)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="font-display text-lg font-bold text-ink">
            {kind === "IMAGE" ? "Crop & send" : "Check video (≤30s)"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-muted hover:bg-mint"
          >
            Cancel
          </button>
        </div>

        <div className="bg-forest/95 p-4">
          {kind === "IMAGE" ? (
            <div
              className="relative mx-auto h-[280px] w-[280px] cursor-grab overflow-hidden rounded-xl border-2 border-brass active:cursor-grabbing"
              onPointerDown={(e) => {
                if (!previewReady) return;
                setDragging(true);
                dragStart.current = {
                  x: e.clientX,
                  y: e.clientY,
                  ox: offset.x,
                  oy: offset.y,
                };
                (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!dragging) return;
                setOffset({
                  x: dragStart.current.ox + (e.clientX - dragStart.current.x),
                  y: dragStart.current.oy + (e.clientY - dragStart.current.y),
                });
              }}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={objectUrl}
                alt="Crop preview"
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: cover ? `${cover.w}px` : "auto",
                  height: cover ? `${cover.h}px` : "100%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  opacity: previewReady ? 1 : 0.35,
                }}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                  setPreviewReady(true);
                  setPreviewError("");
                }}
                onError={() => {
                  // Browser <img> may fail (HEIC etc.) — still try bitmap decode for crop.
                  void decodeImage(file)
                    .then((src) => {
                      const { w, h } = sourceSize(src);
                      if (w && h) {
                        setNatural({ w, h });
                        setPreviewReady(true);
                        setPreviewError("Preview limited — crop still works from the file.");
                      } else {
                        setPreviewReady(false);
                        setPreviewError(
                          "Preview failed in browser. You can still send the original file.",
                        );
                      }
                      if ("close" in src && typeof src.close === "function") {
                        try {
                          src.close();
                        } catch {
                          // ignore
                        }
                      }
                    })
                    .catch(() => {
                      setPreviewReady(false);
                      setPreviewError(
                        "Preview failed in browser. You can still send the original file.",
                      );
                    });
                }}
              />
              {!previewReady && !previewError ? (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-paper">
                  Loading…
                </p>
              ) : null}
            </div>
          ) : (
            <video
              src={objectUrl}
              controls
              playsInline
              muted
              preload="metadata"
              className="mx-auto max-h-[320px] w-full rounded-xl bg-ink"
              onLoadedMetadata={(e) => {
                setPreviewReady(true);
                const d = e.currentTarget.duration;
                setVideoMetaOk(Number.isFinite(d) && d > 0 && d <= 30.05);
                if (Number.isFinite(d) && d > 30.05) {
                  setPreviewError("This video is longer than 30 seconds.");
                }
              }}
              onLoadedData={() => setPreviewReady(true)}
              onError={() => {
                setPreviewReady(true);
                setPreviewError(
                  "Browser could not preview this codec — you can still try Send if it is ≤30s.",
                );
              }}
            />
          )}
        </div>

        {kind === "IMAGE" ? (
          <div className="border-t border-line px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-muted">
              <span className="w-12 font-semibold text-ink">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={!previewReady}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--forest)]"
              />
            </label>
            <p className="mt-2 text-xs text-muted">Drag to frame the square crop, then send.</p>
          </div>
        ) : (
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            MP4 / WebM / MOV up to 30 seconds. Preview when the browser supports the codec.
            {videoMetaOk ? " Length OK." : ""}
          </p>
        )}

        {previewError ? (
          <p className="border-t border-line px-4 py-2 text-sm font-semibold text-brass-deep">
            {previewError}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-line bg-cream px-4 py-2 text-sm font-semibold text-ink"
          >
            Back
          </button>
          {kind === "IMAGE" && previewError ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onReady(file)}
              className="rounded-xl border border-line bg-mint px-4 py-2 text-sm font-semibold text-forest disabled:opacity-50"
            >
              Send original
            </button>
          ) : null}
          <button
            type="button"
            disabled={
              busy ||
              (kind === "IMAGE" && !previewReady && !previewError) ||
              (kind === "VIDEO" && previewError.includes("longer than 30"))
            }
            onClick={() => {
              if (kind === "IMAGE") void finishImage();
              else onReady(file);
            }}
            className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {busy ? "Preparing…" : kind === "IMAGE" ? "Crop & send" : "Send video"}
          </button>
        </div>
      </div>
    </div>
  );
}
