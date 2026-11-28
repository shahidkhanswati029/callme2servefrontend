"use client";

import { useEffect, useState } from "react";

/**
 * Commits search text for API calls only when:
 * - the field is cleared, or
 * - the user finishes a word (value ends with whitespace).
 *
 * Mid-word letter presses do NOT update the committed value (no pause debounce).
 * For Enter: callers should append a trailing space, e.g. setDraft((v) => `${v.trim()} `).
 */
export function useCompleteWordQuery(draft: string): string {
  const [committed, setCommitted] = useState(() => draft.trim());

  useEffect(() => {
    const trimmed = draft.trim();

    if (!trimmed) {
      setCommitted("");
      return;
    }

    if (/\s$/.test(draft)) {
      setCommitted(trimmed);
    }
  }, [draft]);

  return committed;
}
