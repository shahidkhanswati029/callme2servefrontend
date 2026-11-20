import type { PublicAccount } from "@/modules/identity/types";

/** Public entry pages signed-in users must never stay on. */
export const GUEST_ONLY_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/desk/login",
]);

export function isGuestOnlyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (GUEST_ONLY_PATHS.has(pathname)) return true;
  return false;
}

export function homeForAccount(
  account: Pick<PublicAccount, "seat" | "city" | "placeLabel">,
): string {
  if (account.seat === "DESK") return "/desk";
  if (!account.city?.trim() || !account.placeLabel?.trim()) {
    return "/onboarding/details";
  }
  return "/home";
}
