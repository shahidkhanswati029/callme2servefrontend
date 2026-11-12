import { sessionCookies } from "@/shared/cookies";

/** Read access token from localStorage/memory — never from Redux or document.cookie. */
export function getAccessToken() {
  return sessionCookies.getAccessToken();
}
