"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { homeForAccount, isGuestOnlyPath } from "@/modules/identity/authRoutes";

/**
 * Keeps signed-in experts/desk off landing, login, and signup —
 * including browser Back / bfcache restores.
 */
export function SignedInRouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { account, hydrated } = useAppSelector((s) => s.session);

  useEffect(() => {
    if (!hydrated || !account) return;

    const bounce = () => {
      const path = window.location.pathname;
      if (!isGuestOnlyPath(path)) return;
      router.replace(homeForAccount(account));
    };

    bounce();

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) bounce();
    };
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("popstate", bounce);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("popstate", bounce);
    };
  }, [hydrated, account, pathname, router]);

  return null;
}
