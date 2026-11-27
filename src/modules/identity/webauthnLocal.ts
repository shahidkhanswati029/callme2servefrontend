/** Per-device WebAuthn credential ids so mobile can assert without discoverable keys. */

const KEY = "cm2s_webauthn_cred_ids";

export function readLocalWebAuthnCredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 32);
  } catch {
    return [];
  }
}

export function rememberLocalWebAuthnCredId(credentialId: string) {
  if (typeof window === "undefined" || !credentialId) return;
  const next = Array.from(new Set([credentialId, ...readLocalWebAuthnCredIds()])).slice(0, 32);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export async function platformAuthenticatorAvailable(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { browserSupportsWebAuthn } = await import("@simplewebauthn/browser");
    if (!browserSupportsWebAuthn()) return false;
    if (
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
        "function"
    ) {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch {
    return false;
  }
}
