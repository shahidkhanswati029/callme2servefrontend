"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { identityApi } from "@/modules/identity/api";
import { BrandMark } from "@/modules/identity/components/BrandMark";
import { LaptopChrome } from "@/modules/identity/components/LaptopChrome";
import { RequireAuth } from "@/modules/identity/components/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAccount } from "@/store/slices/sessionSlice";
import { useToast } from "@/shared/toast/ToastProvider";
import { ButtonLoader } from "@/shared/ui/Loader";
import { listCountries, currencyForCountry } from "@/shared/countries";
import { getAccessToken } from "@/lib/token";

export default function DetailsPage() {
  return (
    <RequireAuth seat="EXPERT">
      <DetailsInner />
    </RequireAuth>
  );
}

function DetailsInner() {
  const account = useAppSelector((s) => s.session.account)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const countries = useMemo(() => listCountries(), []);
  const [country, setCountry] = useState(account.country || "PK");
  const [languagesText, setLanguagesText] = useState(
    account.languages.length ? account.languages.join(", ") : "",
  );
  const speakPresets = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto"];

  useEffect(() => {
    if (!getAccessToken()) router.replace("/");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const languages = languagesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const city = String(fd.get("city") || "").trim();
      const placeLabel = String(fd.get("placeLabel") || "").trim();
      const work = String(fd.get("work") || "").trim();
      if (!city || !placeLabel) {
        toast.error("City and place are required");
        setBusy(false);
        return;
      }
      if (!work) {
        toast.error("Work is required");
        setBusy(false);
        return;
      }
      const res = await identityApi.saveDetails(getAccessToken(), {
        work,
        languages,
        city,
        placeLabel,
        phone: String(fd.get("phone") || "") || undefined,
      });
      dispatch(
        setAccount({
          ...res.data.account,
          country,
          currency: currencyForCountry(country),
        }),
      );
      toast.success(res.message || "Details saved");
      router.replace("/home");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save details");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LaptopChrome
      panel={
        <div>
          <BrandMark />
          <p className="eyebrow" style={{ color: "var(--brass)", marginTop: "2rem" }}>
            Your details
          </p>
          <h2 className="display" style={{ fontSize: "2.3rem", margin: "0.5rem 0" }}>
            City and place.
          </h2>
          <p className="lede">
            Fill the required fields below. Use the placeholders as a guide.
          </p>
        </div>
      }
    >
      <p className="eyebrow">After Google / Facebook</p>
      <h2 className="display" style={{ fontSize: "2rem", margin: "0.25rem 0 0.75rem" }}>
        Finish your profile
      </h2>
      <p className="lede" style={{ marginBottom: "1.25rem" }}>
        Hello {account.name}. City and place are required so nearby experts can find you.
      </p>

      <form className="stack-lg" onSubmit={onSubmit}>
        <label className="field">
          <span>Work</span>
          <input
            name="work"
            required
            defaultValue={account.work || ""}
            placeholder="e.g. Tutor, Electrician, Surgical"
          />
        </label>
        <div className="field">
          <span>Languages (optional)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "0.4rem 0" }}>
            {speakPresets.map((p) => {
              const on = languagesText
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .includes(p.toLowerCase());
              return (
                <button
                  key={p}
                  type="button"
                  className={`btn ${on ? "btn-primary" : "btn-ghost"}`}
                  style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
                  onClick={() => {
                    const parts = languagesText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    if (on) {
                      setLanguagesText(
                        parts.filter((x) => x.toLowerCase() !== p.toLowerCase()).join(", "),
                      );
                    } else {
                      setLanguagesText([...parts, p].join(", "));
                    }
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <input
            name="languages"
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
            placeholder="Urdu, English, Punjabi"
          />
        </div>
        <label className="field">
          <span>City *</span>
          <input
            name="city"
            required
            defaultValue={account.city || ""}
            placeholder="e.g. Sialkot"
          />
        </label>
        <label className="field">
          <span>Place on the map *</span>
          <input
            name="placeLabel"
            required
            defaultValue={account.placeLabel || ""}
            placeholder="e.g. Ugoki Road, Sialkot"
          />
        </label>
        <label className="field">
          <span>Country</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} · {c.currency}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="phone" defaultValue={account.phone || ""} placeholder="+92 …" />
        </label>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? <ButtonLoader /> : "Save and continue"}
        </button>
      </form>
    </LaptopChrome>
  );
}
