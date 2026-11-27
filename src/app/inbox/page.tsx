"use client";

/** Empty right pane when no thread is selected (list lives in layout). */
export default function InboxPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[#efe8d8] p-8 text-center">
      <div>
        <p className="font-display text-2xl font-bold text-forest">Select a chat</p>
        <p className="mt-2 text-sm text-muted">
          Experts stay on the left. Open a thread to message on the right.
        </p>
      </div>
    </div>
  );
}
