"use client";

import { useState, type FormEvent } from "react";
import { MarketingShell } from "@/modules/marketing/MarketingShell";
import { PageHero } from "@/modules/marketing/PageHero";
import { marketingApi } from "@/modules/marketing/api";
import { ButtonLoader } from "@/shared/ui/Loader";
import { useToast } from "@/shared/toast/ToastProvider";
import { useAppSelector } from "@/store/hooks";

export default function ContactPage() {
  const toast = useToast();
  const countryCode = useAppSelector((s) => s.uiPrefs.countryCode);
  const [kind, setKind] = useState<"CONTACT" | "COMPLAINT">("CONTACT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await marketingApi.contact({
        kind,
        name: name.trim(),
        email: email.trim(),
        city: city.trim() || undefined,
        country: countryCode || undefined,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      toast.success(
        kind === "COMPLAINT" ? "Complaint sent to the desk" : "Message sent to the desk",
      );
      setName("");
      setEmail("");
      setCity("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Contact"
        title="Talk to the desk"
        lede="Questions, city requests, partnership notes, and complaints land on the company desk seat in full detail."
      />
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-cream p-5 text-sm">
          <h2 className="font-display text-xl font-bold">Reach us</h2>
          <ul className="mt-4 grid gap-3 text-muted">
            <li>
              Email:{" "}
              <a className="font-semibold text-forest" href="mailto:maaali615@gmail.com">
                maaali615@gmail.com
              </a>
            </li>
            <li>Country preference: {countryCode}</li>
            <li>Choose Contact or Complaint — both open a full desk detail page.</li>
            <li>Desk operators use the desk email seat — no password field.</li>
          </ul>
        </div>
        <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-line bg-cream p-5">
          <div className="flex flex-wrap gap-2">
            {(["CONTACT", "COMPLAINT"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  kind === k ? "bg-forest text-paper" : "border border-line"
                }`}
              >
                {k === "COMPLAINT" ? "Complaint" : "Contact"}
              </button>
            ))}
          </div>
          <label className="grid gap-1 text-sm font-semibold">
            Name
            <input
              required
              className="rounded-xl border border-line bg-paper px-3 py-3 font-normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Email
            <input
              required
              type="email"
              className="rounded-xl border border-line bg-paper px-3 py-3 font-normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            City (optional)
            <input
              className="rounded-xl border border-line bg-paper px-3 py-3 font-normal"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Request a city or mention yours"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Subject (optional)
            <input
              className="rounded-xl border border-line bg-paper px-3 py-3 font-normal"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={kind === "COMPLAINT" ? "What went wrong?" : "How can we help?"}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Message
            <textarea
              required
              rows={5}
              className="rounded-xl border border-line bg-paper px-3 py-3 font-normal"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {busy ? <ButtonLoader /> : kind === "COMPLAINT" ? "Send complaint" : "Send message"}
          </button>
        </form>
      </section>
    </MarketingShell>
  );
}
