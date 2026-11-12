"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { Loader } from "@/shared/ui/Loader";
import { sessionCookies } from "@/shared/cookies";

const DESK_PREFIXES = ["/desk"];
const EXPERT_ONLY_PREFIXES = [
  "/home",
  "/inbox",
  "/notifications",
  "/jobs",
  "/shops",
  "/settings",
  "/earnings",
  "/refer",
  "/alarms",
  "/onboarding",
];

function pathMatches(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Redirect signed-in users away from welcome/login/register. */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { account, hydrated, status } = useAppSelector((s) => s.session);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated || !account) return;
    if (account.seat === "DESK") router.replace("/desk");
    else if (!account.work || !account.city) router.replace("/onboarding/details");
    else if (!account.hasWebAuthn) router.replace("/onboarding/biometrics");
    else router.replace("/home");
  }, [hydrated, account, router]);

  if (!hydrated || status === "loading") return <Loader full label="Checking session…" />;
  if (account) return <Loader full label="Redirecting…" />;
  return <>{children}</>;
}

/** Require signed-in expert or desk — blocks cross-dashboard URL hopping. */
export function RequireAuth({
  children,
  seat,
}: {
  children: React.ReactNode;
  seat?: "EXPERT" | "DESK";
}) {
  const { account, hydrated, status } = useAppSelector((s) => s.session);
  const router = useRouter();
  const pathname = usePathname();

  // While bootstrap runs, keep showing loader if we still have a stored session.
  const hasStoredSession = Boolean(
    sessionCookies.getAccessToken() ||
      sessionCookies.getRefreshToken() ||
      sessionCookies.getAccount(),
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!account) {
      // Only bounce to landing when hydrate finished AND no stored session remains.
      if (!hasStoredSession) router.replace("/");
      return;
    }

    if (seat && account.seat !== seat) {
      router.replace(account.seat === "DESK" ? "/desk" : "/home");
      return;
    }

    if (account.seat === "DESK" && pathMatches(pathname, EXPERT_ONLY_PREFIXES)) {
      router.replace("/desk");
      return;
    }
    if (
      account.seat === "EXPERT" &&
      pathMatches(pathname, DESK_PREFIXES) &&
      pathname !== "/desk/login"
    ) {
      router.replace("/home");
    }
  }, [hydrated, account, seat, router, pathname, hasStoredSession]);

  if (!hydrated || status === "loading") {
    return <Loader full label="Loading…" />;
  }
  if (!account) {
    return <Loader full label={hasStoredSession ? "Restoring session…" : "Redirecting…"} />;
  }
  if (seat && account.seat !== seat) return <Loader full label="Redirecting…" />;
  if (account.seat === "DESK" && pathMatches(pathname, EXPERT_ONLY_PREFIXES)) {
    return <Loader full label="Redirecting…" />;
  }
  if (
    account.seat === "EXPERT" &&
    pathMatches(pathname, DESK_PREFIXES) &&
    pathname !== "/desk/login"
  ) {
    return <Loader full label="Redirecting…" />;
  }
  return <>{children}</>;
}
