import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CallMe2Serve — Find trusted local experts near you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social / Google share image — generated at request time, no app logic changes. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #1b3c33 0%, #14332b 55%, #0f1c18 100%)",
          color: "#fff9f0",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "#e09a2b",
          }}
        >
          CallMe2Serve
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 700, maxWidth: 980 }}>
            Find trusted local experts near you.
          </div>
          <div style={{ fontSize: 28, color: "#d7e6df", maxWidth: 900, lineHeight: 1.35 }}>
            Live GPS pins · Ask · Bid · Chat · Real receipts
          </div>
        </div>
        <div style={{ fontSize: 22, color: "#c9d8d1" }}>
          Pakistan & worldwide · Tutors, makers, shops, and more
        </div>
      </div>
    ),
    { ...size },
  );
}
