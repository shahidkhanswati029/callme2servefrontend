/** Force a browser download for chat media (Cloudinary-friendly). */
export async function downloadMedia(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerAnchor(objectUrl, filename);
    URL.revokeObjectURL(objectUrl);
    return;
  } catch {
    // Cross-origin fallback: Cloudinary fl_attachment or open URL
    triggerAnchor(toAttachmentUrl(url), filename, true);
  }
}

function toAttachmentUrl(url: string) {
  if (url.includes("/upload/") && !url.includes("fl_attachment")) {
    return url.replace("/upload/", "/upload/fl_attachment/");
  }
  return url;
}

function triggerAnchor(href: string, filename: string, newTab = false) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  if (newTab) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function mediaFilename(kind: "IMAGE" | "VIDEO", url: string) {
  const extFromUrl = url.split("?")[0]?.split(".").pop()?.toLowerCase();
  const safeExt =
    kind === "IMAGE"
      ? ["jpg", "jpeg", "png", "gif", "webp", "heic"].includes(extFromUrl || "")
        ? extFromUrl
        : "jpg"
      : ["mp4", "webm", "mov", "m4v"].includes(extFromUrl || "")
        ? extFromUrl
        : "mp4";
  return `callme2serve-${kind.toLowerCase()}-${Date.now()}.${safeExt}`;
}
