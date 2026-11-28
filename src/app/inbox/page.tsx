"use client";

import { t } from "@/shared/i18n";
import { useUiLanguage } from "@/shared/useUiLanguage";

/** Empty right pane when no thread is selected (list lives in layout). */
export default function InboxPage() {
  const lang = useUiLanguage();

  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[#efe8d8] p-8 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-forest">{t(lang, "selectChat")}</p>
        <p className="mt-2 text-sm text-muted">{t(lang, "selectChatHint")}</p>
      </div>
    </div>
  );
}
