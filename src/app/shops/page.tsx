"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { shopsApi, type Shop } from "@/modules/shops/api";
import { uploadMedia } from "@/modules/chat/api";
import { useToast } from "@/shared/toast/ToastProvider";
import { Loader, ButtonLoader } from "@/shared/ui/Loader";
import { AppShell } from "@/modules/layout/AppShell";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";

export default function ShopsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <ShopsInner />
    </RequireAuth>
  );
}

function ShopsInner() {
  const toast = useToast();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [type, setType] = useState("surgical");
  const [name, setName] = useState("");
  const [maker, setMaker] = useState("");
  const [institute, setInstitute] = useState("");
  const [factory, setFactory] = useState("");
  const [company, setCompany] = useState("");
  const [street, setStreet] = useState("");
  const [doorUrl, setDoorUrl] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number; accuracyM: number } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shopsApi.mine();
      setShop(res.data.shops[0] || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load shops");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createShop(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const typeFields: Record<string, string> =
        type === "surgical"
          ? { maker, institute, factory }
          : type === "leather"
            ? { company }
            : {};
      const res = await shopsApi.create({ type, name, typeFields, street });
      setShop(res.data.shop);
      toast.success(res.message || "Shop created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create shop");
    } finally {
      setBusy(false);
    }
  }

  function capturePin() {
    if (!navigator.geolocation) {
      toast.error("GPS unavailable");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Math.round(pos.coords.accuracy || 10),
        });
        toast.success("Shop pin captured from GPS");
        setBusy(false);
      },
      () => {
        toast.error("Allow location to pin the shop");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  }

  async function savePin() {
    if (!shop || !pin) {
      toast.error("Capture GPS pin first");
      return;
    }
    setBusy(true);
    try {
      const res = await shopsApi.savePin(shop.id, {
        latitude: pin.lat,
        longitude: pin.lng,
        accuracyM: pin.accuracyM,
      });
      setShop(res.data.shop);
      toast.success(res.message || "Shop pin saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Pin failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDoorFile(file: File) {
    setBusy(true);
    try {
      const uploaded = await uploadMedia(file);
      setDoorUrl(uploaded.url);
      if (shop) {
        const res = await shopsApi.setDoorPhoto(shop.id, uploaded.url);
        setShop(res.data.shop);
      }
      toast.success("Door photo uploaded to Cloudinary");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDoor() {
    if (!shop || !doorUrl) return;
    setBusy(true);
    try {
      const res = await shopsApi.setDoorPhoto(shop.id, doorUrl);
      setShop(res.data.shop);
      toast.success(res.message || "Door photo saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Door photo failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Shops">
        <Loader label="Loading shops…" />
      </AppShell>
    );
  }

  return (
    <AppShell title="Your shop">
      <section className="mb-4 rounded-2xl border border-line bg-mint p-4 text-sm text-ink">
        <h3 className="font-display text-lg font-bold">Easy shop path</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
          <li>
            <strong className="text-ink">1 · Create</strong> — name + type (real details only).
          </li>
          <li>
            <strong className="text-ink">2 · Pin</strong> — stand at the door and capture GPS.
          </li>
          <li>
            <strong className="text-ink">3 · Door photo</strong> — upload; street text alone never
            publishes. Then status becomes LIVE.
          </li>
        </ol>
      </section>

      {shop ? (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-line bg-cream p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brass-deep">
              {shop.status}
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold">{shop.name}</h2>
            <p className="text-sm text-muted">
              {shop.type} · {shop.street || "No street"}
            </p>
            {shop.heldReason ? (
              <p className="mt-2 rounded-lg bg-mint px-3 py-2 text-sm text-forest">
                Held: {shop.heldReason}
              </p>
            ) : shop.status === "LIVE" ? (
              <p className="mt-2 text-sm font-semibold text-success">Live on the map</p>
            ) : (
              <p className="mt-2 text-sm text-muted">Finish pin + door photo to go live.</p>
            )}
            {shop.doorPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shop.doorPhotoUrl}
                alt="Door"
                className="mt-3 max-h-40 rounded-xl border border-line object-cover"
              />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {[
              ["2", "GPS pin"],
              ["3", "Door photo"],
            ].map(([n, label]) => (
              <span key={n} className="rounded-lg border border-line bg-cream px-3 py-1.5">
                Step {n} · {label}
              </span>
            ))}
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={capturePin}
            className="rounded-xl border border-line px-4 py-3 font-semibold disabled:opacity-50"
          >
            {busy ? <ButtonLoader /> : "Step 2 · Capture GPS at the door"}
          </button>
          {pin ? (
            <p className="text-sm text-muted">
              Ready: {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)} ±{pin.accuracyM}m
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy || !pin}
            onClick={() => void savePin()}
            className="rounded-xl bg-forest px-4 py-3 font-semibold text-paper disabled:opacity-50"
          >
            Save live pin
          </button>

          <label className="grid gap-1 text-sm font-semibold">
            Step 3 · Door photo
            <input
              type="file"
              accept="image/*,.heic,.heif,.avif,.tif,.tiff,.bmp,.gif,.webp,.jfif,.jpg,.jpeg,.png"
              className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onDoorFile(f);
              }}
            />
          </label>
          {doorUrl && !shop.doorPhotoUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveDoor()}
              className="rounded-xl border border-line px-4 py-3 font-semibold disabled:opacity-50"
            >
              Save door photo
            </button>
          ) : null}
        </div>
      ) : (
        <form className="grid gap-3" onSubmit={createShop}>
          <p className="text-xs font-semibold uppercase tracking-wide text-brass-deep">
            Step {step} of 1 · Create
          </p>
          <label className="grid gap-1 text-sm font-semibold">
            Type
            <select
              className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="surgical">Surgical</option>
              <option value="leather">Leather</option>
              <option value="institute">Institute</option>
              <option value="factory">Factory</option>
              <option value="tutor">Tutor</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Shop name
            <input
              className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your real shop name"
              required
            />
          </label>
          {type === "surgical" ? (
            <>
              <label className="grid gap-1 text-sm font-semibold">
                Maker
                <input
                  className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
                  value={maker}
                  onChange={(e) => setMaker(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Institute
                <input
                  className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
                  value={institute}
                  onChange={(e) => setInstitute(e.target.value)}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Factory
                <input
                  className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
                  value={factory}
                  onChange={(e) => setFactory(e.target.value)}
                  required
                />
              </label>
            </>
          ) : null}
          {type === "leather" ? (
            <label className="grid gap-1 text-sm font-semibold">
              Company
              <input
                className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </label>
          ) : null}
          <label className="grid gap-1 text-sm font-semibold">
            Street (optional — not enough to publish)
            <input
              className="rounded-xl border border-line bg-cream px-3 py-3 font-normal"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-forest px-4 py-3 font-semibold text-paper disabled:opacity-50"
            onClick={() => setStep(1)}
          >
            {busy ? <ButtonLoader /> : "Create shop · continue to pin"}
          </button>
        </form>
      )}
    </AppShell>
  );
}
