"use client";

import { GuestOnly } from "@/modules/identity/components/AuthGuard";
import { ExpertLoginForm } from "@/modules/identity/components/ExpertLoginForm";

export default function LoginPage() {
  return (
    <GuestOnly>
      <ExpertLoginForm />
    </GuestOnly>
  );
}
