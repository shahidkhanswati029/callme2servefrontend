"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Commits a search string for API calls only when:
 * - the field is cleared, or
 * - the user finishes a word (trailing space / Enter), or
 * - typing pauses after a complete non-empty word (debounce).
 * Mid-word keystrokes do not commit.
 */
export function useCompleteWordQuery(draft: string, debounceMs = 450): string {
  const [committed, setCommitted] = useState(() => draft.trim());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = draft.trim();
    const endsWithSpace = /\s$/.test(draft);

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (!trimmed) {
      setCommitted("");
      return;
    }

    if (endsWithSpace) {
      setCommitted(trimmed);
      return;
    }

    timer.current = setTimeout(() => {
      // Pause after typing → treat current token as a complete word.
      setCommitted(trimmed);
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, debounceMs]);

  return committed;
}
