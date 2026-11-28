import type { Metadata } from "next";
import { pageMetadata } from "@/shared/seo";

export const metadata: Metadata = pageMetadata({
  path: "/login",
  title: "Expert sign-in",
  description:
    "Sign in to CallMe2Serve with fingerprint, face, Google, or Facebook — no password required for experts.",
  keywords: ["CallMe2Serve login", "expert sign in"],
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
