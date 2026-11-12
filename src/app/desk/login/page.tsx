"use client";

import { DeskLoginForm } from "@/modules/identity/components/DeskLoginForm";
import { GuestOnly } from "@/modules/identity/components/AuthGuard";

export default function DeskLoginPage() {
  return (
    <GuestOnly>
      <DeskLoginForm />
    </GuestOnly>
  );
}
