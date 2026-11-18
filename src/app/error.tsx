"use client";

import { useEffect } from "react";
import { SystemError } from "@/shared/ui/SystemError";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CallMe2Serve]", error);
  }, [error]);

  const network =
    /failed to fetch|network|load failed|econnrefused|timeout|offline/i.test(
      error.message || "",
    );

  return (
    <SystemError
      kind={network ? "network" : "server"}
      message={error.message || undefined}
      digest={error.digest}
      onRetry={reset}
    />
  );
}
